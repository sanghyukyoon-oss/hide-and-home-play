// 털기 / 털리기: while you are away the neighbourhood residents sneak into your home and try to find what you hid.
// Whatever they find, they take one thing home with them (it really leaves your collection), whatever they miss pays
// you coins. You get it back by finding it in their room — and every room you clear lets you pocket one thing.
//   save.raid = { next, revenge, log: [{ at, who, nick, face, kind: 'steal'|'fail', item?, coins, seen }],
//                 stolen: { 'practice-<i>': [item…] }, robbed: { roomKey: time }, loot: [{ item, from, at }],
//                 shield: time (문단속 until), armStage: the stage count when the first raid was set up }
// Who comes round: the residents and the (made-up) players of the ready-made houses (houses.js) — raiders(); robbed, they come back for revenge.
import { RESIDENTS } from './net.js';
import { ITEMS } from './gfx/items.js';
import './i18n-raid.js';   // the raid's English (10/20)
import { seatedAll } from './econ.js';   // 친구 지킴이: 방에 앉은 친구들 (10/20)
import { bumpFeat } from './specials.js';   // 스페셜 칸 '털림 막기 N번' (경제 10/20)
import { CHAR_DEFS } from './gfx/chars.js';
import { HOUSES } from './houses.js';   // 털 집 찾기 (10/20): the neighbourhood's (made-up) players come round too
import { GIFT_THINGS } from './gifts.js';   // 선물로 받은 보물은 안 가져감 (② 10/22)
import { TOOL_ODDS, toolsAt, useUp } from './defense.js';   // 지키기 도구 (② 10/22)

const FIRST_DELAY = 3 * 60e3;        // the first raid comes soon after you first hide something
const EVERY = 4 * 3600e3;            // then about every four hours you are away
const REVENGE = 5 * 60e3;            // rob a resident and they come round for revenge soon after
const MAX_CATCHUP = 3;               // at most this many raids are counted for one absence (2 → 3: ② 10/22, '방문 2~3명')
const ROB_COOLDOWN = 6 * 3600e3;     // one grab per room per six hours
// 친구 지킴이 (10/20 user: "친구 넣으면 친구가 침입당할 때 한 번 찾는 거 방해"): the friends sitting in my room may stop a find,
// in the order they sat; the stopped thing stays. Tune the most friends that guard here (② 10/22: each one now stops the find a quarter of
// the time — ODDS.guard; three things in drawers, 0~4 friends: robbed 59/44/33/25/19 % a visit, raidsim)
export const FRIEND_BLOCK_MAX = 4;
const SHIELD = 4 * 3600e3;           // 문단속 (Clash's shield, 10/19): robbed once, nobody comes for a while (8 h → 4 h: ② 10/22, 자주 털리게)
// some noses are better than others
const NOSE = { shiba: .15, nerd: .1, grumpy: .05, hamster: .05, skater: 0, panda: 0, frog: -.05, sleepy: -.15 };

const isTarget = t => t !== 'key' && t !== 'note';
export const raidOf = save => save.raid || (save.raid = { next: 0, revenge: null, log: [], stolen: {}, robbed: {}, loot: [] });
export const hiddenTargets = save => (save.home?.hide?.items || []).filter(e => isTarget(e.item));
export const residentId = i => 'practice-' + i;
// who comes round: the residents (a resident with a ready-made house as its owner) and every other house's owner
export function raiders() {
  const m = RESIDENTS.map((r, i) => ({ id: residentId(i), nick: r.nick, face: r.face }));
  for (const H of HOUSES) { const o = { id: H.owner.id, nick: H.owner.nick, face: H.owner.face }, k = m.findIndex(x => x.id === o.id); if (k >= 0) m[k] = o; else m.push(o); }
  return m;
}
export const shieldLeft = (save, now = Date.now()) => Math.max(0, (raidOf(save).shield || 0) - now);
// 자물쇠 사기 (10/19, user via 인수인계: "자물쇠랑 열쇠도 구매 가능하게?"): padlocks for my home are owned, one to start (or
// as many as already hang there), more from the shop's 물건 tab. Keys are not sold — a bought key would skip the stages'
// key-and-lock puzzle and the raid's 보물 star; the magnifier already points to a key you can't find.
export const LOCK_PRICE = 150, LOCK_MAX = 4;
export const locksUsed = save => Object.keys(save.home?.hide?.locks || {}).length;
export function locksOwned(save) { const R = raidOf(save); if (R.locksOwned == null) R.locksOwned = Math.min(LOCK_MAX, Math.max(1, locksUsed(save))); return R.locksOwned; }
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
const eul = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '을' : '를'); };

// Run the raids that happened since the last look. force = n runs n raids right now (debug / QA).
export function runRaids(G, { now = Date.now(), force = 0 } = {}) {
  const save = G.save, R = raidOf(save);
  if (!hiddenTargets(save).length && !force) { R.next = 0; return []; }
  if (!R.next && !force) { R.next = now + FIRST_DELAY; R.armStage = save.stage || 0; G.persist(); return []; }
  // the very first raid comes once you've cleared a stage since hiding, whatever the clock says — so it is seen (10/19)
  if (!force && !R.log.length && R.armStage != null && (save.stage || 0) > R.armStage) R.next = Math.min(R.next, now);
  // 문단속: while the door is locked nobody comes (a revenge waits too); the clock goes on from when it opens
  if (!force && shieldLeft(save, now)) { R.next = Math.max(R.next, R.shield); return []; }
  let n = force;
  if (!force) {
    while (R.next <= now && n < MAX_CATCHUP) { n++; R.next += EVERY; }
    if (R.next <= now) R.next = now + EVERY;
  }
  const out = [];
  for (let k = 0; k < n; k++) { const ev = raidOnce(G, now); if (ev) out.push(ev); if (ev?.shield && !force) break; }   // (robbed: the door locks, the rest of the absence is safe)
  if (out.length || force) G.persist();
  return out;
}

// which drawer or lid a hidden thing is in, for every kind of record (외부 QA 10/21 #05: only free.part counted, so a thing on a
// fixed snap spot inside a drawer — the default way to hide — got neither the drawer's nor its lock's protection): a fixed spot
// keeps its part key (myhome.js placeTreasure, filled in for older saves on load), a free place has free.part, or a free host 'p:…'
export const hidePart = e => e.part || e.free?.part || (typeof e.free?.host === 'string' && e.free.host.startsWith('p:') ? e.free.host.slice(2) : null);

// ── 털릴 확률 (② 10/22, 사용자 실폰: 개굴이·보드킹 둘 다 "하나도 못 가져갔어 +30" → "너무 방어를 잘한다", "좀 개털려야 돈을 쓰지").
// Before, every hidden thing rolled on its own and the lock, the drawer and a friend each took a big bite: one lock, things in
// drawers and one friend at home came to under 20 % a visit. Now one roll a visit: about two in three with nothing done,
// and each padlocked thing, each thing in a drawer and each friend at home takes a clear bite out of it — so a padlock
// bought is felt on the next visit. Tune here; tools: ② nm-tools/raidsim.mjs prints the table.
export const ODDS = { base: .72, inside: .05, locked: .15, min: .1, max: .85, guard: .25 };
// how one hidden thing is kept: 'open' · 'inside' (a drawer or a lid) · 'locked' (that drawer is padlocked)
export const keptBy = (e, locks) => { const p = hidePart(e); return p ? (locks[p] ? 'locked' : 'inside') : 'open'; };
// the chance a visitor finds something (before the friends at home step in)
export function findOdds(hid, locks, face = null) {
  let p = ODDS.base + (NOSE[face] || 0);
  for (const e of hid) { const k = keptBy(e, locks); if (k === 'inside') p -= ODDS.inside; else if (k === 'locked') p -= ODDS.locked; }
  return Math.max(ODDS.min, Math.min(ODDS.max, p));
}
// what they come away with: a coin purse (15 % of your coins, 20~120) or the thing they found — half and half; a gift's thing
// (선물 상자) is never taken, it's the coins then; too few coins to bother with, the thing
export const PURSE = { frac: .15, min: 20, max: 120 };
const NO_TAKE = new Set(GIFT_THINGS);
export const purseOf = coins => coins < PURSE.min ? 0 : Math.max(PURSE.min, Math.min(PURSE.max, Math.round(coins * PURSE.frac)));
// a visit that found nothing: a small thank-you (was 15 a thing: 30 for two — "+30" every time felt like winning)
export const keepPay = n => Math.min(30, 10 * n);
function raidOnce(G, now) {
  const save = G.save, R = raidOf(save), H = save.home, hid = hiddenTargets(save);
  if (!hid.length) return null;
  // (an old save keeps a resident's index for revenge; now it's the owner's id)
  const pool = raiders(), rv = R.revenge; R.revenge = null;
  const back = rv != null ? pool.find(o => o.id === (typeof rv === 'number' ? residentId(rv) : rv)) : null;
  const who = back || pool[Math.floor(Math.random() * pool.length)], id = who.id, revenge = !!back;
  const locks = H.hide.locks || {};
  // one roll: did they find anything? Then which — the easier to see, the likelier (open 4 · in a drawer 2 · padlocked 1)
  const found = [], T = toolsAt(H), ev = { at: now, who: id, nick: who.nick, face: who.face, revenge, seen: false };
  if (Math.random() < findOdds(hid, locks, who.face)) {
    // (지키기 도구 10/22: a 미끼 상자 in the room is picked like a thing left out — then they take the box, not mine)
    const w = e => ({ open: 4, inside: 2, locked: 1 })[keptBy(e, locks)], dw = T.decoys.length * TOOL_ODDS.decoyWeight;
    let r = Math.random() * (hid.reduce((a, e) => a + w(e), 0) + dw);
    if (r < dw) { const d = T.decoys[Math.floor(r / TOOL_ODDS.decoyWeight)]; ev.decoy = d.id || true; ev.decoyAt = d.i != null ? { i: d.i, j: d.j } : d.x != null ? { x: d.x, z: d.z } : null; ev.tool = 'decoy'; useUp(H, d); }
    else { r -= dw; found.push((hid.find(e => (r -= w(e)) < 0) || hid[hid.length - 1]).item); }
  }
  // what stops a find: a bell on that drawer, a banana peel, the robot vacuum, each friend at home (ODDS.guard, up to
  // FRIEND_BLOCK_MAX) — one roll for them together, at most TOOL_ODDS.cap, then which of them it was by their odds
  const guards = [...seatedAll(H)].filter(k => CHAR_DEFS[k]).slice(0, FRIEND_BLOCK_MAX), blockedBy = {};
  for (const it of found) {
    const e = hid.find(x => x.item === it), st = [];
    if (T.bells[hidePart(e)]) st.push(['tool:bell', TOOL_ODDS.bell]);
    if (T.peels.length) st.push(['tool:banana', TOOL_ODDS.banana]);
    if (T.robovac) st.push(['tool:robovac', TOOL_ODDS.robovac]);
    for (const k of guards) st.push([k, ODDS.guard]);
    const pAll = Math.min(TOOL_ODDS.cap, 1 - st.reduce((a, [, q]) => a * (1 - q), 1));
    if (!st.length || Math.random() >= pAll) continue;
    let q = Math.random() * st.reduce((a, [, x]) => a + x, 0); const k = (st.find(([, x]) => (q -= x) < 0) || st[st.length - 1])[0];
    blockedBy[it] = k;
    if (k === 'tool:banana') useUp(H, T.peels[0]);   // (the peel that tripped them is gone)
    if (k.startsWith('tool:')) ev.tool = k.slice(5);
  }
  const taken = found.filter(it => !blockedBy[it]);
  if (Object.values(blockedBy).some(k => !k.startsWith('tool:'))) ev.blocked = Object.values(blockedBy).filter(k => !k.startsWith('tool:'));
  // ① 털림 다시 보기 (10/19): what was hidden where and what this resident found — raidreplay.js plays it back in my room
  ev.rp = { zone: H.hide.zoneId, locks: { ...locks }, items: hid.map(e => ({ item: e.item, ...(e.free ? { free: e.free } : { spot: e.spot }), found: found.includes(e.item), ...(blockedBy[e.item] ? { by: blockedBy[e.item] } : {}) })) };
  if (taken.length) {
    const item = taken[0], purse = purseOf(save.coins || 0);
    ev.kind = 'steal'; ev.coins = 0;
    if (purse && (NO_TAKE.has(item) || Math.random() < .5)) {
      // the coin purse: they found where you hid things and took coins from beside it; the thing stays
      ev.got = item; ev.lost = purse; save.coins = Math.max(0, (save.coins || 0) - purse);
    } else if (NO_TAKE.has(item)) { ev.kind = 'fail'; ev.coins = 0; ev.got = item; ev.empty = true; }   // (a gift and an empty purse: nothing to take)
    else {
      ev.item = item;
      // it really goes: out of the hiding place, the drafts and my collection, into their room until I take it back
      H.hide.items = H.hide.items.filter(x => x.item !== item);
      for (const d of Object.values(H.drafts || {})) if (d?.items) d.items = d.items.filter(x => x.item !== item);
      save.collection = save.collection.filter(x => x !== item);
      const st = R.stolen[id] || (R.stolen[id] = []);
      if (!st.includes(item)) st.push(item);
    }
    if (ev.kind === 'steal') { R.shield = ev.shield = now + SHIELD; R.next = Math.max(R.next || 0, R.shield); }   // 문단속
  } else { ev.kind = 'fail'; ev.coins = ev.decoy ? TOOL_ODDS.decoyPay : keepPay(hid.length); bumpFeat(save, 'keeps'); }
  if (ev.coins) save.coins += ev.coins;
  R.log.push(ev); R.log = R.log.slice(-20);
  return ev;
}

export const unseen = save => raidOf(save).log.filter(e => !e.seen);
export function markSeen(G) { for (const e of raidOf(G.save).log) e.seen = true; G.persist(); if (typeof document !== 'undefined') document.querySelectorAll('.badge.newsn').forEach(e => e.remove()); }   // (the lobby's number on 놀러 가기 — ③ 10/21)
export function newsLine(e) {
  const fr = (e.blocked || []).map(k => CHAR_DEFS[k]?.name).filter(Boolean);
  if (e.kind === 'steal' && e.lost) return `${ga(e.nick)} ${e.revenge ? '복수하러 와서 ' : ''}코인 ${e.lost}개를 털어 갔어! -${e.lost}`;
  if (e.kind === 'steal') return `${ga(e.nick)} ${e.revenge ? '복수하러 와서 ' : ''}${eul(ITEMS[e.item]?.name || '물건')} 털어 갔어!` + (fr.length ? ` (친구가 ${fr.length}개 막아 줌)` : e.coins ? ` (못 찾은 물건 덕에 +${e.coins})` : '');
  if (e.empty) return `${ga(e.nick)} 왔다가 빈손으로 갔어!`;
  if (e.tool === 'decoy') return `${ga(e.nick)} 미끼 상자를 들고 갔어! 속았지롱 +${e.coins}`;
  if (e.tool === 'bell') return `${ga(e.nick)} 경보 벨에 놀라서 도망갔어! +${e.coins}`;
  if (e.tool === 'banana') return `${ga(e.nick)} 바나나 껍질에 미끄러져서 빈손으로 갔어! +${e.coins}`;
  if (e.tool === 'robovac') return `${ga(e.nick)} 로봇청소기한테 쫓겨났어! +${e.coins}`;
  if (fr.length) return `${ga(e.nick)} 왔다가 ${fr.join('·')}한테 막혀서 하나도 못 가져갔어! +${e.coins}`;
  return `${ga(e.nick)} ${e.revenge ? '복수하러 왔다가' : '몰래 왔다가'} 하나도 못 찾고 갔어! +${e.coins}`;
}

// my things that a resident is holding (their room hides them, marked as mine)
export const stolenBy = (save, id) => raidOf(save).stolen[id] || [];
// who holds my things: the one holding `item`, else the one holding the most (QA9 P2: 되찾으러 가기 went to a random house)
export function holderOf(save, item = null) {
  const e = Object.entries(raidOf(save).stolen || {}).filter(([, l]) => l?.length && (!item || l.includes(item)));
  e.sort((a, b) => b[1].length - a[1].length);
  return e[0]?.[0] || null;
}

// after clearing someone's room: take back what was mine (all of it — it was all found), then pocket one thing
// (only: 타이머 털기 — just the ones found before the count ran out; the rest stay there)
export function retrieve(G, room, only = null) {
  if (!room?.resident) return [];
  const R = raidOf(G.save), held = R.stolen[room.id] || [], back = held.filter(t => !only || only.includes(t));
  if (!back.length) return [];
  for (const t of back) { if (!G.save.collection.includes(t)) G.save.collection.push(t); }
  R.stolen[room.id] = held.filter(t => !back.includes(t));
  G.addCoins(back.length * 20);
  G.persist();
  return back;
}
export function canGrab(G, room) {
  if (!room || room.selfTest) return false;
  const k = room.practice ? room.id : room.owner;
  return !(Date.now() - (raidOf(G.save).robbed[k] || 0) < ROB_COOLDOWN);
}
// returns { item, isNew, coins }
export function grab(G, room, item) {
  const R = raidOf(G.save), k = room.practice ? room.id : room.owner, now = Date.now();
  R.robbed[k] = now;
  R.loot.push({ item, from: room.nick || room.ownerName || '누군가', at: now }); R.loot = R.loot.slice(-40);
  const isNew = !G.save.collection.includes(item) && !ITEMS[item]?.decoy;
  if (isNew) G.save.collection.push(item); else G.addCoins(25);
  // a resident you robbed comes round for revenge — soon, if there is anything at home to find
  if (room.resident) { R.revenge = room.id; R.next = Math.min(R.next || Infinity, now + REVENGE); }
  G.persist();
  return { item, isNew, coins: isNew ? 0 : 25 };
}

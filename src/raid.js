// 털기 / 털리기: while you are away the neighbourhood residents sneak into your home and try to find what you hid.
// Whatever they find, they take one thing home with them (it really leaves your collection), whatever they miss pays
// you coins. You get it back by finding it in their room — and every room you clear lets you pocket one thing.
//   save.raid = { next, revenge, log: [{ at, who, nick, face, kind: 'steal'|'fail', item?, coins, seen }],
//                 stolen: { 'practice-<i>': [item…] }, robbed: { roomKey: time }, loot: [{ item, from, at }],
//                 shield: time (문단속 until), armStage: the stage count when the first raid was set up }
// Residents are the characters of the visit list (net.js RESIDENTS) and are always shown as residents, never as players.
import { RESIDENTS } from './net.js';
import { ITEMS } from './gfx/items.js';

const FIRST_DELAY = 3 * 60e3;        // the first raid comes soon after you first hide something
const EVERY = 4 * 3600e3;            // then about every four hours you are away
const REVENGE = 5 * 60e3;            // rob a resident and they come round for revenge soon after
const MAX_CATCHUP = 2;               // at most this many raids are counted for one absence
const ROB_COOLDOWN = 6 * 3600e3;     // one grab per room per six hours
const SHIELD = 8 * 3600e3;           // 문단속 (Clash's shield, 10/19): robbed once, nobody comes for eight hours
// some noses are better than others
const NOSE = { shiba: .15, nerd: .1, grumpy: .05, hamster: .05, skater: 0, panda: 0, frog: -.05, sleepy: -.15 };

const isTarget = t => t !== 'key' && t !== 'note';
export const raidOf = save => save.raid || (save.raid = { next: 0, revenge: null, log: [], stolen: {}, robbed: {}, loot: [] });
export const hiddenTargets = save => (save.home?.hide?.items || []).filter(e => isTarget(e.item));
export const residentId = i => 'practice-' + i;
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

function raidOnce(G, now) {
  const save = G.save, R = raidOf(save), H = save.home, hid = hiddenTargets(save);
  if (!hid.length) return null;
  let i = R.revenge != null ? R.revenge : Math.floor(Math.random() * RESIDENTS.length);
  const revenge = R.revenge != null; R.revenge = null;
  const who = RESIDENTS[i], id = residentId(i);
  const locks = H.hide.locks || {}, nLocks = Object.keys(locks).length;
  const found = [];
  for (const e of hid) {
    let p = .5 + (NOSE[who.face] || 0) - Math.min(.2, nLocks * .1);
    if (e.free?.part) p -= .18;                       // inside a drawer or a lid
    if (e.free?.part && locks[e.free.part]) p -= .2;  // …and that one is locked
    if (Math.random() < Math.max(.08, Math.min(.85, p))) found.push(e.item);
  }
  const ev = { at: now, who: id, nick: who.nick, face: who.face, revenge, seen: false };
  // ① 털림 다시 보기 (10/19): what was hidden where and what this resident found — raidreplay.js plays it back in my room
  ev.rp = { zone: H.hide.zoneId, locks: { ...locks }, items: hid.map(e => ({ item: e.item, ...(e.free ? { free: e.free } : { spot: e.spot }), found: found.includes(e.item) })) };
  if (found.length) {
    const item = found[Math.floor(Math.random() * found.length)];
    ev.kind = 'steal'; ev.item = item; ev.coins = (hid.length - found.length) * 10;
    // it really goes: out of the hiding place, the drafts and my collection, into their room until I take it back
    H.hide.items = H.hide.items.filter(x => x.item !== item);
    for (const d of Object.values(H.drafts || {})) if (d?.items) d.items = d.items.filter(x => x.item !== item);
    save.collection = save.collection.filter(x => x !== item);
    const st = R.stolen[id] || (R.stolen[id] = []);
    if (!st.includes(item)) st.push(item);
    R.shield = ev.shield = now + SHIELD;   // 문단속
    R.next = Math.max(R.next || 0, R.shield);
  } else { ev.kind = 'fail'; ev.coins = 15 * hid.length; }
  if (ev.coins) save.coins += ev.coins;
  R.log.push(ev); R.log = R.log.slice(-20);
  return ev;
}

export const unseen = save => raidOf(save).log.filter(e => !e.seen);
export function markSeen(G) { for (const e of raidOf(G.save).log) e.seen = true; G.persist(); }
export function newsLine(e) {
  if (e.kind === 'steal') return `${ga(e.nick)} ${e.revenge ? '복수하러 와서 ' : ''}${eul(ITEMS[e.item]?.name || '물건')} 털어 갔어!` + (e.coins ? ` (못 찾은 물건 덕에 +${e.coins})` : '');
  return `${ga(e.nick)} ${e.revenge ? '복수하러 왔다가' : '몰래 왔다가'} 하나도 못 찾고 갔어! +${e.coins}`;
}

// my things that a resident is holding (their room hides them, marked as mine)
export const stolenBy = (save, id) => raidOf(save).stolen[id] || [];

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
  if (room.resident) { const i = +String(room.id).split('-')[1]; if (Number.isFinite(i)) { R.revenge = i; R.next = Math.min(R.next || Infinity, now + REVENGE); } }
  G.persist();
  return { item, isNew, coins: isNew ? 0 : 25 };
}

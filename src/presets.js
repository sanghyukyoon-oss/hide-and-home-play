// 놀러 가기 = 털 집 찾기 (10/20 user: "놀러 가기 하면 실제 사람 찾는 것처럼 하는 게 나을 것 같아. 진짜 클래시 오브 클랜처럼 랜덤한
// 방 찾는 거지 … 미리 만들어진 프리셋 마을들이 나오는 거지. 꽤 멋지고 이쁜 집들 나와야 더 하고 싶은 맛이 있을지도. 그래서 가짜 유저들이
// 털러 오기도 하고.. 실 유저로 나중에 잘되면"). Ready-made homes of the neighbourhood's (made-up) players, decorated past what a
// new player owns — the specials, the walls and floors of later chapters, a stage set's furniture — so a raid shows what a home
// can become.
//
// A house is plain data, the same shape a published room has (net.js listRooms) so a server can hand these out later unchanged:
//   { id, v: 1, owner: { id, nick, face, lv }, title, brag, tier,
//     zone: { type, style?, size?, paint?: {wallKind, wall, wall2, wainscot, floorKind, floor, floor2}, decor?: [{type, wall, u}],
//             furniture: [{ type, i, j, rot, id }] }  — or a house of rooms: zone: { rooms: [{ at: [x, z], ...a zone }] },
//     hidden?: [{ item, spot }], locks?: [{ part, kind }], code? }
// `hidden` left out = dealt here from the house's own seed (a real player's house would bring its own).
import { Room, indexSpots } from './room.js';
import { ITEMS, TARGET_POOL } from './gfx/items.js';
import { zoneLayout, houseLayout } from './catalog.js';
import { MapRooms } from './map.js';
import { FURN_INFO } from './gfx/furniture.js';
import { rng } from './util.js';

import { HOUSES } from './houses.js';
export { HOUSES };

const hashStr = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const fakeWorld = { shadowDirty: false, yaw: Math.PI / 4 };
const TIER = { 1: { n: 3, lock: false }, 2: { n: 4, lock: false }, 3: { n: 5, lock: true }, 4: { n: 6, lock: true } };

// a house → what the raid (stage custom) plays: the furniture that fits, its things dealt into places, a lock on the hard ones
export function houseRoom(H, mine = []) {
  const r = rng(hashStr(H.id) + 917);
  // one room, or several joined; the furniture goes in piece by piece so a piece that doesn't fit is left out (and said)
  const Z = H.zone, multi = !!Z.rooms, zs = multi ? Z.rooms : [Z];
  const room = multi ? new MapRooms(fakeWorld, houseLayout({ ...Z, rooms: zs.map(z => ({ ...z, furniture: [] })) })) : new Room(fakeWorld, zoneLayout({ ...Z, furniture: [] }));
  const RS = multi ? room.rooms : [room];
  let n = 0;
  const placed = zs.map((z, k) => {
    const out = [];
    for (const f of z.furniture) {
      if (!FURN_INFO[f.type]) { console.warn('[house]', H.id, 'no model', f.type); continue; }
      if (!RS[k].canPlace(f.type, f.i, f.j, f.rot || 0)) { console.warn('[house]', H.id, 'does not fit', f.type, f.i, f.j); continue; }
      const id = 'h' + n++; RS[k].addFurniture(f.type, f.i, f.j, f.rot || 0, id); out.push({ ...f, id });
    }
    return out;
  });
  const zone = multi ? { ...zs[0], ...Z, rooms: zs.map((z, k) => ({ ...z, furniture: placed[k] })), type: zs[0].type, furniture: [] } : { ...Z, furniture: placed[0] };
  const T = TIER[H.tier] || TIER[1];
  let hidden = H.hidden, locks = H.locks || [];
  if (!hidden) {
    const { spots, parts } = indexSpots(room);
    // the inside of things first (a drawer, a lid, under the bed) — a good hiding place is one you have to open or look under
    const keys = r.shuffle(Object.keys(spots).filter(k => !k.startsWith('d'))).sort((a, b) => (spots[b].part ? 1 : 0) - (spots[a].part ? 1 : 0));
    const own = r.shuffle(TARGET_POOL.slice()).slice(0, T.n);
    const items = [...new Set([...mine, ...own])];
    hidden = [];
    for (const t of items) {
      const k = keys.find(k => !hidden.some(x => x.spot === k) && ITEMS[t].h * (spots[k].scale || 1) <= spots[k].maxH && (spots[k].maxH >= .1 || ITEMS[t].flat));
      if (k) hidden.push({ item: t, spot: k });
    }
    locks = [];
    // a house that has a lock: one of its things goes behind a lockable door or lid if none is there yet
    const fitsIn = (t, sp) => ITEMS[t].h * (sp.scale || 1) <= sp.maxH && (sp.maxH >= .1 || ITEMS[t].flat);
    if (T.lock && hidden.length && !Object.values(parts).some(p => p.lockable && p.spots.some(s => hidden.some(x => x.spot === s.key)))) {
      const e = hidden[hidden.length - 1];
      const sp = Object.values(parts).filter(p => p.lockable).flatMap(p => p.spots).find(sp => !hidden.some(x => x.spot === sp.key) && fitsIn(e.item, sp));
      if (sp) e.spot = sp.key;
    }
    const lp = T.lock && Object.entries(parts).find(([, p]) => p.lockable && p.spots.some(s => hidden.some(x => x.spot === s.key)));
    if (lp) {
      const kind = lp[1].furn.type === 'safe' ? 'code' : 'pad';
      const chain = kind === 'pad' ? 'key' : 'note';
      const k = keys.find(k => !hidden.some(x => x.spot === k) && !(spots[k].part && spots[k].part === lp[1]) && ITEMS[chain].h <= spots[k].maxH);
      if (k) { locks.push({ part: lp[0], kind }); hidden.push({ item: chain, spot: k }); }
    }
  }
  const O = H.owner;
  return {
    // keyed by the owner the way a resident's room is (practice-<i> stays the same person — 보드킹's old save still finds his house)
    id: O.id, house: H.id, practice: true, resident: true, owner: O.id, ownerName: O.nick, nick: O.nick, face: O.face, lv: O.lv, tier: H.tier, brag: H.brag, title: H.title,
    stolen: mine.filter(t => hidden.some(x => x.item === t)),
    zone, hidden, locks, code: H.code || String(r.int(100, 999)),
    count: hidden.filter(x => x.item !== 'key' && x.item !== 'note').length,
  };
}

// ── 털 집 찾기: who could come up, and the one that does
// every house of the neighbourhood: the ready-made ones, the residents who have none yet (their old rooms), shared rooms if any
export function housePool(G, { practiceRooms, makePractice, stolenBy, residentId, shared = [] }) {
  const S = G.save, made = new Set(HOUSES.map(h => h.owner.id));
  const houses = HOUSES.map(h => houseRoom(h, stolenBy(S, h.owner.id)));
  const rest = practiceRooms((r, i) => makePractice(r, i, stolenBy(S, residentId(i)))).filter(p => !made.has(p.id)).map(p => ({ ...p, tier: 1, lv: 2 + p.count }));
  return [...houses, ...rest, ...shared.map(r => ({ ...r, tier: r.tier || 2 }))];
}
// the tier that fits how far you've come (쉬운 집 → 어려운 집)
export const tierFor = stage => stage < 8 ? 1 : stage < 20 ? 2 : stage < 40 ? 3 : 4;
// one at random: the fitting tier most, one step off now and then, the last few you saw hardly ever
export function pickHouse(pool, stage, recent = []) {
  const want = tierFor(stage || 0);
  const w = r => (recent.includes(r.id || r.owner) ? .04 : 1) * ([3, 1][Math.abs((r.tier || 1) - want)] ?? .25);
  const tot = pool.reduce((a, r) => a + w(r), 0);
  let x = Math.random() * tot;
  for (const r of pool) { x -= w(r); if (x <= 0) return r; }
  return pool[pool.length - 1];
}

// A shared room is written by another player's game: check it before publishing, after reading it and before planning.
//   validateRoom(doc) → null when it is fine, otherwise a short reason (Korean, shown to the author on publish)
// Checks the shape (types, sizes, finite coordinates in range) and the meaning that can be checked without building
// the room: known furniture / items / lock kinds, no item hidden twice, every lock has its key or note in the room.
import { ITEMS } from './gfx/items.js';
import { FURN_INFO } from './gfx/furniture.js';
import { ZONE_TYPES, GPT_ROOFS } from './catalog.js';
import { roofId } from './gfx/gpt-roofs.js';

const HOST = /^(room|f:[A-Za-z0-9_-]{1,40}|d:\d{1,3}|p:[^\s]{1,80})$/;
const SPOT = /^[^\s]{1,80}$/;
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const num = (v, lim) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= lim;
const own = (o, k) => o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);

export function validateRoom(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return '형식이 아니에요';
  const z = doc.zone;
  if (!z || typeof z !== 'object' || !own(ZONE_TYPES, z.type)) return '방 종류를 알 수 없어요';
  if (!Array.isArray(z.furniture) || z.furniture.length > 60) return '가구 목록이 이상해요';
  if (z.style != null && (typeof z.style !== 'string' || !/^st-[a-z0-9-]{1,30}$/.test(z.style))) return '테마가 이상해요';
  if (z.size != null && !(Number.isInteger(z.size) && z.size >= 0 && z.size <= 8)) return '방 크기가 이상해요';
  if (z.roof != null && !GPT_ROOFS.some(r => r.id === roofId(z.roof))) return '모르는 지붕이에요';
  if (z.roofTurn != null && !(Number.isInteger(z.roofTurn) && z.roofTurn >= 0 && z.roofTurn < 4)) return '지붕 방향이 이상해요';
  const ids = new Set();
  for (const f of z.furniture) {
    if (!f || typeof f !== 'object' || !own(FURN_INFO, f.type)) return '모르는 가구가 있어요';
    if (f.id != null) { if (typeof f.id !== 'string' || !ID.test(f.id) || ids.has(f.id)) return '가구 번호가 이상해요'; ids.add(f.id); }
    if (f.x != null || f.z != null || f.a != null) { if (!num(f.x, 20) || !num(f.z, 20) || !num(f.a ?? 0, 100)) return '가구 위치가 이상해요'; }
    else if (!num(f.i, 40) || !num(f.j, 40) || !num(f.rot ?? 0, 3)) return '가구 칸이 이상해요';
  }
  if (!Array.isArray(doc.hidden) || doc.hidden.length > 24) return '숨긴 물건 목록이 이상해요';
  const items = new Set();
  for (const e of doc.hidden) {
    if (!e || typeof e !== 'object' || typeof e.item !== 'string' || !own(ITEMS, e.item)) return '모르는 물건이 있어요';
    if (items.has(e.item)) return '같은 물건이 두 번 숨겨져 있어요';
    items.add(e.item);
    if (e.free != null) {
      const f = e.free;
      if (typeof f !== 'object' || typeof f.host !== 'string' || !HOST.test(f.host)) return '숨긴 자리를 알 수 없어요';
      if (f.part != null && (typeof f.part !== 'string' || !SPOT.test(f.part))) return '숨긴 자리를 알 수 없어요';
      if (!Array.isArray(f.p) || f.p.length !== 3 || !f.p.every(v => num(v, 20))) return '숨긴 위치가 이상해요';
      if (f.ry != null && !num(f.ry, 100)) return '숨긴 방향이 이상해요';
    } else if (typeof e.spot !== 'string' || !SPOT.test(e.spot)) return '숨긴 자리를 알 수 없어요';
  }
  const locks = doc.locks ?? [];
  if (!Array.isArray(locks) || locks.length > 10) return '잠금 목록이 이상해요';
  const parts = new Set();
  for (const l of locks) {
    if (!l || typeof l !== 'object' || typeof l.part !== 'string' || !SPOT.test(l.part) || (l.kind !== 'pad' && l.kind !== 'code')) return '잠금이 이상해요';
    if (parts.has(l.part)) return '같은 곳이 두 번 잠겨 있어요';
    parts.add(l.part);
    if (!items.has(l.kind === 'pad' ? 'key' : 'note')) return l.kind === 'pad' ? '열쇠 없이 잠긴 곳이 있어요' : '비밀번호 쪽지 없이 잠긴 곳이 있어요';
  }
  if (doc.code != null && (typeof doc.code !== 'string' || !/^\d{3,4}$/.test(doc.code))) return '비밀번호가 이상해요';
  const targets = doc.hidden.filter(e => e.item !== 'key' && e.item !== 'note').length;
  if (!targets) return '숨긴 물건이 없어요';
  if (doc.count != null && doc.count !== targets) return '물건 수가 맞지 않아요';
  return null;
}

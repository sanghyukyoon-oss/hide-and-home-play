// Shared rooms between strangers (artifact `db` capability), with a local practice fallback.
//   rooms/{uid}  — each player's published hide-and-seek room (only they can write it, everyone reads)
//   plays/{uid}  — each player's results as a finder: { results: { [ownerUid]: { found, total, ok (best), tries, wins, fails, at } } }
//                  tries/wins/fails only ever grow, so the owner's 'reward per failed visit' can be claimed against them
// Only opaque user ids are stored; names are resolved at render time with user.profiles().
import { rng } from './util.js';
import { validateRoom } from './roomdoc.js';

const NET = { db: null, user: null, uid: null, ready: false, ok: false };
export function net() { return NET; }

// Connect on first need only (visit list, my home's record, publishing): asking for the shared store makes claude.ai
// show a sign-in prompt to signed-out players, and that prompt must not cover the stage while someone is playing.
let _init = null;
export function initNet() { return _init || (_init = connect()); }
async function connect() {
  const c = window.claude;
  if (!c?.use) { NET.ready = true; return NET; }
  try {
    const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
    NET.db = db; NET.user = user;
    NET.uid = user ? await user.id() : null;
    NET.ok = !!(db && NET.uid);
  } catch { NET.ok = false; }
  NET.ready = true;
  return NET;
}

export async function publishRoom(room) {
  if (!NET.ok) return { ok: false, why: 'offline' };
  try {
    await NET.db.doc('rooms/' + NET.uid).set({ ...room, owner: NET.uid, updatedAt: Date.now() });
    return { ok: true };
  } catch (e) { return { ok: false, why: e?.code || 'error' }; }
}
export async function unpublishRoom() {
  if (!NET.ok) return;
  try { await NET.db.doc('rooms/' + NET.uid).delete(); } catch {}
}

export async function listRooms(limit = 40) {
  if (!NET.ok) return [];
  try {
    const snap = await NET.db.collection('rooms').orderBy('updatedAt', 'desc').limit(limit).get();
    // other players wrote these: only rooms that pass the same check as publishing get in
    return snap.docs.filter(d => d.exists).map(d => ({ id: d.id, ...d.data() })).filter(r => !validateRoom(r));
  } catch { return []; }
}

// all finders' results, folded per room owner: { [ownerUid]: { plays, wins, fails } }
export async function roomStats() {
  if (!NET.ok) return {};
  try {
    const snap = await NET.db.collection('plays').limit(500).get();
    const out = Object.create(null);
    for (const d of snap.docs) {
      const r = d.data()?.results;
      if (!r || typeof r !== 'object') continue;
      for (const owner of Object.keys(r)) {
        if (!UID.test(owner)) continue;
        const c = tally(r[owner]); if (!c) continue;
        const o = out[owner] || (out[owner] = { visitors: 0, plays: 0, wins: 0, fails: 0 });
        o.visitors++; o.plays += c.tries; o.wins += c.wins; o.fails += c.fails;
      }
    }
    return out;
  } catch { return {}; }
}

// older docs stored only the best attempt: count that as one try. Counts that don't add up are not believed (null).
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const count = v => Number.isSafeInteger(v) && v >= 0 && v <= 100000;
export function tally(r) {
  if (!r || typeof r !== 'object') return null;
  if (r.tries != null) {
    const t = { tries: r.tries, wins: r.wins ?? 0, fails: r.fails ?? 0 };
    return count(t.tries) && count(t.wins) && count(t.fails) && t.tries === t.wins + t.fails ? t : null;
  }
  return { tries: 1, wins: r.ok === true ? 1 : 0, fails: r.ok === true ? 0 : 1 };
}
let _myPlays = null, _playBusy = Promise.resolve();
export function recordPlay(ownerUid, result) {
  if (!NET.ok || !ownerUid || ownerUid === NET.uid) return Promise.resolve();
  // one write at a time, so two quick results never overwrite each other
  _playBusy = _playBusy.then(async () => {
    const ref = NET.db.doc('plays/' + NET.uid);
    try {
      if (!_myPlays) {
        const s = await ref.get(), r = s.exists ? s.data().results : null;
        _myPlays = {};
        if (r && typeof r === 'object') for (const k of Object.keys(r)) if (UID.test(k) && tally(r[k])) _myPlays[k] = r[k];
      }
      const prev = _myPlays[ownerUid], c = tally(prev) || { tries: 0, wins: 0, fails: 0 };
      // best result per room (a later loss never erases a win), counters always grow
      const best = prev?.ok && !result.ok ? { found: prev.found, total: prev.total, ok: true }
        : !prev?.ok && !result.ok && prev && (prev.found || 0) > result.found ? { found: prev.found, total: prev.total, ok: false }
        : { found: result.found, total: result.total, ok: result.ok };
      // keep the new result only once it is really saved (a failed write must not ride along with the next one)
      const next = { ..._myPlays, [ownerUid]: { ...best, tries: c.tries + 1, wins: c.wins + (result.ok ? 1 : 0), fails: c.fails + (result.ok ? 0 : 1), at: Date.now() } };
      await ref.set({ results: next });
      _myPlays = next;
    } catch {}
  });
  return _playBusy;
}

// stagelog/{uid} — each player's last 300 stage results, for balancing timers from real play: { runs: [...] }
let _myLog = null, _logBusy = Promise.resolve();
export function logStage(entry) {
  if (!NET.ok) return;
  _logBusy = _logBusy.then(async () => {
    const ref = NET.db.doc('stagelog/' + NET.uid);
    try {
      if (!_myLog) { const s = await ref.get(); _myLog = s.exists ? (s.data().runs || []).slice(-299) : []; }
      const next = [..._myLog, { ...entry, at: Date.now() }].slice(-300);
      await ref.set({ runs: next });
      _myLog = next;
    } catch {}
  });
}

export async function names(ids) {
  if (!NET.user || !ids.length) return {};
  try { const ps = await NET.user.profiles(ids); const o = {}; for (const id of ids) o[id] = ps[id]?.name || ''; return o; } catch { return {}; }
}

// ── neighbourhood rooms: the game's own characters hid things in their places. Always there, so the visit list is
// never empty; real players' rooms mix in when the shared store has some. They are characters, not fake players.
export const RESIDENTS = [
  { face: 'grumpy', nick: '삐딱이', title: '절대 못 찾는 방', brag: '…흥. 이번엔 절대 못 찾을걸.' },
  { face: 'skater', nick: '보드킹', title: '스케이트 창고', brag: '요! 보드 타고 휙휙 숨겼어. 빨리 찾아 봐!' },
  { face: 'sleepy', nick: '졸졸이', title: '낮잠 마당', brag: '음냐… 자다가 어디 숨겼는지 까먹었어…' },
  { face: 'nerd', nick: '박사', title: '수수께끼 연구실', brag: '흠. 논리적으로 생각하면 다 찾을 수 있지.' },
  { face: 'shiba', nick: '멍뭉이', title: '뼈다귀 숨김터', brag: '멍! 킁킁 냄새로 찾아 봐!' },
  { face: 'hamster', nick: '햄찌', title: '볼주머니 창고', brag: '웁웁! 볼에 넣을까 하다가 참았어!' },
  { face: 'frog', nick: '개굴이', title: '비 오는 날 방', brag: '개굴! 연못 근처를 잘 봐~' },
  { face: 'panda', nick: '판다', title: '대나무 공원', brag: '천천히 찾아 봐. 판다는 숨바꼭질 고수야.' },
];
export function practiceRooms(build) {
  return RESIDENTS.map((R, i) => {
    const r = rng(9100 + i * 131);
    const room = build(r, i);
    return { id: 'practice-' + i, practice: true, resident: true, nick: R.nick, face: R.face, brag: R.brag, ...room, title: R.title };
  });
}

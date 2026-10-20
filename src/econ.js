// 경제·내 방 로비 (경제·메타 설계서 /Users/sh/sumbak-econ/econ-design-20261019.md, 10/19 — user: "로비는 내 방으로 변경하는게
// 좋겠어 … 처음엔 빈 공간에 캐릭터 혼자 … 내가 좋아하는 캐릭터 배치할 수 있게"). On by default since 10/19
// (the three decisions at the design's values); ?econ=0 or 더보기 → 새 경제 끄기 turns it off on this device, ?econ=1 back on.
import { stageSpec, THEMES, STAGE_COUNT, CHAR_UNLOCK, REGIONS, regionOf } from './stages.js';
import { CHAR_DEFS } from './gfx/chars.js';
import { FURN_INFO } from './gfx/furniture.js';
import { h } from './ui.js';
import { locksOwned } from './raid.js';   // (mig 2: the padlocks you own are counted before another room's hiding is cleared)

export const ECON = (() => {
  const q = new URLSearchParams(location.search).get('econ');
  try {
    // on by default since 10/19 (user: "추천대로 다 넣어줘"); 'sbk-econ' = '0' keeps it off on this device
    if (q === '1') localStorage.setItem('sbk-econ', '1');
    if (q === '0') localStorage.setItem('sbk-econ', '0');
    return q === '1' || (q !== '0' && localStorage.getItem('sbk-econ') !== '0');
  } catch { return q === '1'; }
})();

// 선물은 아주 가끔 (10/20, user: "선물 50판에 한 세 개면 될 듯? 로봇 포함 10판째는 하나 주자."): the free things in 1~50판 are three —
// 8판's robot (the model kit you built), then a special gift (one of three: a padlock, a thing to hide, a piece the shop doesn't
// sell) on the win card of the boss after 31판 and after 49판, and one more after 70판 (about one in 17 past 50). No 별 상자, no
// chapter box: a chapter's furniture goes into the shop's 기념품 when its last stage is cleared (stage.js).
export const GIFT_AT = [30, 48, 69];   // (0-based stage before the boss: 31판 → 깨우기, 49판 → 보물 지키기, 70판 → 야식)
export const FREE_KITS = ['robot'];    // (the kits whose model comes home free; the rest go to the shop's 기념품)
// 11판's cat tower, the stories' keepsakes and the other kits' models go to the shop's 기념품 — yours to buy — not free into the
// 보관함. true gives them all free again (one switch). Old saves keep theirs.
export const FREE_KEEPSAKES = false;
export const KEEPSAKE_PRICE = 300;   // (a kit's model has no price of its own: 0 in KIT_INFO)
export const toShop = G => G.econ && !FREE_KEEPSAKES;
// a keepsake earned: to the shop's 기념품 (true) or the 보관함 (false)
export function keepsake(G, t) {
  const H = G.save.home;
  if (!toShop(G)) { H.inventory.push(t); return false; }
  H.offered = [...new Set([...(H.offered || []), t])]; return true;
}

// the stages whose clear opens a chapter's box (0-based: 12·21·31·40·49·60·70판) — 설계서 4-2
export const PICK_AT = [11, 20, 30, 39, 48, 59, 69];

// a new save with it on: the fields below from the start (so econMigrate leaves it alone)
export function econSaveFields(s) {
  if (!ECON) return s;
  Object.assign(s, { mig: 4, lens: { bag: 3 }, seen: s.collection.slice() });
  Object.assign(s.home, { offered: [], picks: {}, boxQ: [], friendBox: [], friendKnown: [], starBoxCap: 0, starBoxOpened: 0 });
  for (const z of Object.values(s.home.zones)) z.friends = z.friends || [];
  return s;
}
// an old save, the first time it is opened with it on: new fields only. save.v stays 2 (a cached old build would rebuild a
// save that isn't v2 and lose the home — 설계서 8장); coins, stage, best, stars, furniture and collection are not touched.
export function econMigrate(s) {
  if (!ECON) return s;
  if ((s.mig || 0) >= 1) { if (s.mig < 2) oneRoom(s); if (s.mig < 3) starFreeze(s); if (s.mig < 4) seatsKeep(s); return s; }
  s.lens = s.lens || { bag: 5 };   // the update's gift: a full bag
  s.seen = [...new Set([...(s.seen || []), ...(s.collection || [])])];
  const H = s.home;
  for (const z of Object.values(H.zones)) z.friends = z.friends || [];
  H.offered = H.offered || []; H.picks = H.picks || {}; H.friendBox = H.friendBox || [];
  H.friendKnown = H.friendKnown || null;   // null: the first lobby seats whoever you've met, quietly (one toast)
  H.boxQ = PICK_AT.filter(i => (s.stage || 0) > i && !(i in H.picks));   // boxes of chapters already behind you: 🎁 in the lobby
  s.mig = 1;
  oneRoom(s);
  starFreeze(s);
  return s;
}
// mig 2 (10/20, user: "그냥 방으로 하자"): the home is 몽글이's room alone. The other zones' furniture goes to the 보관함 (nothing is
// lost; the zone records stay, empty, for the house and the town later), anyone sitting there comes over to 몽글이's room, and
// what was hidden in another zone comes out of hiding (the padlocks you own stay yours). The room gets its walls back if it
// still has the open floor everyone started with — a theme you chose stays.
function oneRoom(s) {
  const H = s.home;
  for (const [id, z] of Object.entries(H.zones || {})) {
    if (id === 'room1') continue;
    H.inventory = [...(H.inventory || []), ...(z.furniture || []).map(f => f.type)]; z.furniture = [];
    // (whoever sat there comes over to 몽글이's room on the next visit — the lobby's arrivals seat them, or box them when it's full)
    const gone = (z.friends || []).map(f => f.k).filter(Boolean); if (H.friendKnown) H.friendKnown = H.friendKnown.filter(k => !gone.includes(k)); z.friends = [];
  }
  H.current = 'room1';
  // (재QA TECH-MIG2-LOCK-LOSS 10/20: a save with no padlock count yet owns as many as hang in its hiding room — 털기's own rule —
  // so that number is fixed here, before another room's hiding is cleared; otherwise it fell back to 1)
  locksOwned(s);
  if (H.hide && H.hide.zoneId !== 'room1') H.hide = { zoneId: 'room1', items: [], locks: {}, code: H.hide.code ?? null };
  if (H.zones?.room1 && (!H.zones.room1.style || H.zones.room1.style === 'st-open')) H.zones.room1.style = 'st-classic';
  s.mig = 2;
}
// mig 3 (10/20, user: "그 스테이지 끝나고 선물 존나게 주네 진짜", "선물 50판에 한 세 개면 될 듯?"): no new 별 상자. The boxes this save had
// already filled stay, opened from the lobby's 🎁 별 상자; a save that never had one gets none (GIFT_AT above)
function starFreeze(s) {
  const H = s.home, total = Object.values(s.best || {}).reduce((a, b) => a + (b || 0), 0) + Object.values(s.gameStars || {}).reduce((a, b) => a + (b || 0), 0);
  H.starBoxCap = Math.floor(total / 15);
  if (H.starBoxOpened == null) H.starBoxOpened = H.starBoxCap;
  s.mig = 3;
}
// mig 4 (10/20, user: "친구 슬롯을 또 사야 멀티로 할 수 있게 해 줄래? 처음부터 3개 다 살 수 없고"): a room starts with one friend seat
// and the next ones are bought (SEAT_STEPS). A save from before keeps a seat for everyone sitting there now (nothing taken away)
function seatsKeep(s) {
  for (const z of Object.values(s.home?.zones || {})) z.seats = Math.max(1, Math.min(SEAT_STEPS.length, (z.friends || []).length));
  s.mig = 4;
}

// everyone you have met: a stage's host once that stage is behind you, and the friends a stage gave you (save.chars)
export function metFriends(save) {
  const met = new Set(save.chars || []);
  for (let i = 0; i < Math.min(save.stage || 0, STAGE_COUNT); i++) { const sp = stageSpec(i), k = sp.timed ? 'raccoon' : THEMES[sp.room]?.friend; if (k) met.add(k); }
  for (const [i, k] of Object.entries(CHAR_UNLOCK)) if (+i < (save.stage || 0)) met.add(k);
  if (save.ending) met.add('inky');   // (after the ending 먹물이 is a friend too: the seat it was left — 스토리 룸, GPT QA ST-HOME-INKY)
  return [...met].filter(k => CHAR_DEFS[k] && k !== 'mong' && k !== 'mom');   // (the friend who walks along sits in the room like the rest — 10/19)
}
// seats in a zone: 3, and one more for each of the first three room sizes (max 6) — 설계서 2-4 (사용자 결정 3, 추천값)
// (검토 P0 10/19: 4 first seats — 1장's four hosts 토순·개굴·펭·곰 all sit down in 1~10판; 방 넓히기 is for 2장's friends on)
// 친구 부르기 (10/20, user: "처음부터 친구 하지 말고 친구도 돈 줘야 소환되게 해 줘. 아이템처럼. 친구 슬롯을 최대 4개고 …"): 4 seats,
// whatever the room's size; a friend comes home when you call them (coins, once — then they're yours to seat or box)
// 친구 칸 사기 (10/20, user: "처음부터 3개 다 살 수 없고"): one seat to start; each next one is bought in order, once the stage
// before it is cleared — SEAT_STEPS[k] is seat k+1: { stage: clears needed, price }
export const SEAT_STEPS = [{ stage: 0, price: 0 }, { stage: 5, price: 250 }, { stage: 15, price: 600 }, { stage: 30, price: 1200 }];
export const seatsOf = zone => ECON ? Math.max(1, Math.min(SEAT_STEPS.length, zone?.seats || 1)) : 4 + Math.min(zone?.size || 0, 3);
// the next seat to buy: null when all four are open; ok when the stages are cleared
export function nextSeat(save, zone) {
  const k = seatsOf(zone); if (!ECON || k >= SEAT_STEPS.length) return null;
  const st = SEAT_STEPS[k]; return { n: k + 1, ...st, ok: (save.stage || 0) >= st.stage };
}
export const FRIEND_PRICE = [120, 200, 280, 360, 440, 520, 600];   // by the chapter you met them in
// the stage whose clear brought this friend (its host, a 너굴이 timed stage, a stage's own gift such as 11판's 냥냥이)
export function friendMetAt(k) {
  for (let i = 0; i < STAGE_COUNT; i++) { const sp = stageSpec(i); if ((sp.timed ? 'raccoon' : THEMES[sp.room]?.friend) === k || CHAR_UNLOCK[i] === k) return i; }
  return 0;
}
export const friendPrice = k => FRIEND_PRICE[Math.min(FRIEND_PRICE.length - 1, Math.max(0, REGIONS.indexOf(regionOf(friendMetAt(k)))))];
// yours: called before (sitting somewhere, or in the friend box)
export const ownedFriends = H => new Set([...seatedAll(H), ...(H.friendBox || [])]);
// met in a cleared stage and not called yet
export const callableFriends = save => metFriends(save).filter(k => k !== 'inky' && !ownedFriends(save.home).has(k));
export const seatedAll = H => new Set(Object.values(H.zones).flatMap(z => (z.friends || []).map(f => f.k)));

// ── 장 끝 상자 (설계서 4-2, 사용자 결정 2 추천값): after a chapter's last stage, the first time, pick one of three pieces from
// that chapter; the two you didn't pick go up in the shop as 기념품 (never lost). (Wall pieces can't be placed at home yet:
// 몽나리자 → 그릇 찬장, 칠판 → 학생 책상; the 순찰차 is hidden art with no price → 로봇청소기, the design's own fallback.)
export const PICKS = {
  11: ['fishdock', 'dishcab', 'fishtank'],
  20: ['robovac', 'schooldesk', 'lockers'],
  30: ['quarterpipe', 'graffitiwall', 'postbox2'],
  39: ['espresso', 'icecreamchest', 'pastrycase'],
  48: ['slidetower', 'icecart', 'catfeeder'],
  59: ['tentsmall', 'spring', 'shrinebox'],
  69: ['thinker', 'photoheart', 'donutart'],
};
export const PICK_ITEMS = new Set(Object.values(PICKS).flat());
// the three cards (the 털기 '하나 슬쩍' cards); resolves with the type picked. The bot takes the first.
export function pickPanel(G, list, { title = '선물 상자!', line = '하나 골라!', tag = '선물' } = {}) {
  G.needThumbs?.(list.map(t => 'furn_' + t));
  if (G.bot) return Promise.resolve(list[0]);
  return new Promise(res => {
    let done = false;
    const cards = list.filter(t => FURN_INFO[t]).map(t => {
      const c = h('div', { class: 'lootcard new', role: 'button', tabindex: '0' }, h('img', { src: G.thumbs['furn_' + t] }), h('div', { class: 'lname' }, FURN_INFO[t].name), h('div', { class: 'ltag' }, tag));
      const pick = () => { if (done) return; done = true; G.audio.sfx('special'); G.ui.closePanel(); res(t); };
      c.addEventListener('click', pick); c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pick(); });
      return c;
    });
    G.ui.panel({ title, color: 'orange', body: [h('div', { class: 'txt' }, line), h('div', { class: 'lootgrid' }, ...cards)] });
  });
}
// 장 끝 상자 as a gift (10/20 — gifts.js): what you picked is recorded; the chapter's three pieces of furniture all go up in the
// shop's 기념품 (common furniture is the shop's, never a gift)
export function takeGiftPick(G, idx, c) {
  const H = G.save.home;
  H.picks = { ...(H.picks || {}), [idx]: c.kind === 'lock' || c.kind === 'coins' ? c.kind : c.t };
  H.offered = [...new Set([...(H.offered || []), ...(PICKS[idx] || [])])];
  H.boxQ = (H.boxQ || []).filter(i => i !== idx);
  G.persist();
}
export function takePick(G, idx, chosen) {
  const H = G.save.home;
  H.picks = { ...(H.picks || {}), [idx]: chosen };
  H.inventory.push(chosen);
  H.offered = [...new Set([...(H.offered || []), ...PICKS[idx].filter(t => t !== chosen)])];
  H.boxQ = (H.boxQ || []).filter(i => i !== idx);
  G.persist();
}

// ── 상점 장별 입고 (설계서 6장 N3): a piece of furniture comes into the shop with its chapter (its region: none/home → 1장,
// apt → 2, alley → 3, shop → 4, park → 5, trail/camp → 6, building → 7); what you already own always shows
const CH_OF_REGION = { home: 1, apt: 2, alley: 3, shop: 4, park: 5, trail: 6, camp: 6, building: 7 };
export const chapterOfFurn = t => CH_OF_REGION[FURN_INFO[t]?.region] || 1;
export const chapterNow = save => REGIONS.indexOf(regionOf(save.stage || 0)) + 1;

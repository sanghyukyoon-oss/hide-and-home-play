// 경제·내 방 로비 (경제·메타 설계서 /Users/sh/sumbak-econ/econ-design-20261019.md, 10/19 — user: "로비는 내 방으로 변경하는게
// 좋겠어 … 처음엔 빈 공간에 캐릭터 혼자 … 내가 좋아하는 캐릭터 배치할 수 있게"). On by default since 10/19
// (the three decisions at the design's values); ?econ=0 or 더보기 → 새 경제 끄기 turns it off on this device, ?econ=1 back on.
import { stageSpec, THEMES, STAGE_COUNT, CHAR_UNLOCK, REGIONS, regionOf } from './stages.js';
import { CHAR_DEFS } from './gfx/chars.js';
import { FURN_INFO } from './gfx/furniture.js';
import { h } from './ui.js';

export const ECON = (() => {
  const q = new URLSearchParams(location.search).get('econ');
  try {
    // on by default since 10/19 (user: "추천대로 다 넣어줘"); 'sbk-econ' = '0' keeps it off on this device
    if (q === '1') localStorage.setItem('sbk-econ', '1');
    if (q === '0') localStorage.setItem('sbk-econ', '0');
    return q === '1' || (q !== '0' && localStorage.getItem('sbk-econ') !== '0');
  } catch { return q === '1'; }
})();

// the stages whose clear opens a chapter's box (0-based: 12·21·31·40·49·60·70판) — 설계서 4-2
export const PICK_AT = [11, 20, 30, 39, 48, 59, 69];

// a new save with it on: the fields below from the start (so econMigrate leaves it alone)
export function econSaveFields(s) {
  if (!ECON) return s;
  Object.assign(s, { mig: 1, lens: { bag: 3 }, seen: s.collection.slice() });
  Object.assign(s.home, { offered: [], picks: {}, boxQ: [], friendBox: [], friendKnown: [] });
  for (const z of Object.values(s.home.zones)) z.friends = z.friends || [];
  return s;
}
// an old save, the first time it is opened with it on: new fields only. save.v stays 2 (a cached old build would rebuild a
// save that isn't v2 and lose the home — 설계서 8장); coins, stage, best, stars, furniture and collection are not touched.
export function econMigrate(s) {
  if (!ECON || (s.mig || 0) >= 1) return s;
  s.lens = s.lens || { bag: 5 };   // the update's gift: a full bag
  s.seen = [...new Set([...(s.seen || []), ...(s.collection || [])])];
  const H = s.home;
  for (const z of Object.values(H.zones)) z.friends = z.friends || [];
  H.offered = H.offered || []; H.picks = H.picks || {}; H.friendBox = H.friendBox || [];
  H.friendKnown = H.friendKnown || null;   // null: the first lobby seats whoever you've met, quietly (one toast)
  H.boxQ = PICK_AT.filter(i => (s.stage || 0) > i && !(i in H.picks));   // boxes of chapters already behind you: 🎁 in the lobby
  s.mig = 1;
  return s;
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
export const seatsOf = zone => 3 + Math.min(zone?.size || 0, 3);
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

// 선물 상자 (경제, 10/20 — user: "선물을 왜 이렇게 많이 줘 … 계속 주니 쓰레기 같음", "선물은 맵에 자주 안 나오는 특별한 작은 것들?
// 아님 열쇠나 비밀번호 자물쇠? 이런 템을 아주 가끔 주는 게 좋겠어", "흔히 보이는 건 다 상점에서 구매하는 걸로").
// The big moments only — the 별 상자 (every 15 stars) and the chapter's box — and what's in them is never common furniture
// (that's all in the shop): one of three of
//   · a padlock for a drawer at home (털기: the ones you own, up to 4) while you have room for one,
//   · a special thing to hide at home (a thing no stage hands you: the 황금 생선뼈, the 털기 treasures),
//   · a special little piece for the room that the shop doesn't sell (one stage's prop: the 이젤, the 그리스 항아리 …).
// Keys are not given (털기 세션: they'd skip the locks' puzzles in stages and in 털기). The same box always shows the same
// three (no rerolling by reloading); what you already have is left out.
import { h, ICON } from './ui.js';
import { FURN_INFO } from './gfx/furniture.js';
import { ITEMS } from './gfx/items.js';
import { locksOwned, LOCK_MAX } from './raid.js';
import { starBoxState } from './starbox.js';

export const GIFT_THINGS = ['goldbone', 'console', 'snack', 'report'];
export const GIFT_DECOR = ['easel', 'amphora', 'veiled', 'speaker', 'micstand', 'tacklebox', 'parasol', 'boardrack', 'fishsign', 'baitbucket', 'artcrate'];

const rankOf = (seed, t) => { let x = (seed + 1) * 2654435761 >>> 0; for (let i = 0; i < t.length; i++) x = Math.imul(x ^ t.charCodeAt(i), 16777619) >>> 0; return x; };
const byRank = (seed, list) => list.slice().sort((a, b) => rankOf(seed, a) - rankOf(seed, b));
const owns = (save, t) => save.home.inventory.includes(t) || Object.values(save.home.zones).some(z => (z.furniture || []).some(f => f.type === t));

// box `seed`'s three: { kind: 'lock' } · { kind: 'thing', t } · { kind: 'decor', t } · { kind: 'coins', n } when nothing's left
export function giftChoices(save, seed) {
  const out = [];
  if (locksOwned(save) < LOCK_MAX) out.push({ kind: 'lock' });
  const things = byRank(seed, GIFT_THINGS.filter(t => ITEMS[t] && !(save.collection || []).includes(t))).map(t => ({ kind: 'thing', t }));
  const decor = byRank(seed + 7, GIFT_DECOR.filter(t => FURN_INFO[t] && !owns(save, t))).map(t => ({ kind: 'decor', t }));
  while (out.length < 3 && (things.length || decor.length)) {   // (a thing and a piece in turn)
    const pick = (out.filter(c => c.kind === 'thing').length <= out.filter(c => c.kind === 'decor').length ? things : decor).shift() || things.shift() || decor.shift();
    if (pick) out.push(pick);
  }
  while (out.length < 3) out.push({ kind: 'coins', n: 100 });
  return out;
}
export const giftName = c => c.kind === 'lock' ? '자물쇠' : c.kind === 'thing' ? ITEMS[c.t]?.name || '' : c.kind === 'decor' ? FURN_INFO[c.t]?.name || '' : `코인 ${c.n}`;
const giftTag = c => c.kind === 'lock' ? '서랍 잠그기' : c.kind === 'thing' ? '숨길 보물' : c.kind === 'decor' ? '상점에 없는 소품' : '코인';
const giftImg = (G, c) => c.kind === 'thing' ? G.thumbs['item_' + c.t] : c.kind === 'decor' ? G.thumbs['furn_' + c.t] : null;

// one of three, picked on a card (like the old pick panel); resolves the chosen one
export function giftPanel(G, choices, { title = '선물 상자!', line = '하나 골라!' } = {}) {
  G.needThumbs?.(choices.map(c => c.kind === 'thing' ? 'item_' + c.t : c.kind === 'decor' ? 'furn_' + c.t : null).filter(Boolean));
  if (G.bot) return Promise.resolve(choices[0]);
  return new Promise(res => {
    let done = false;
    const cards = choices.map(c => {
      const img = giftImg(G, c), pic = img ? h('img', { src: img }) : h('div', { class: 'giftico', html: c.kind === 'lock' ? ICON.lock : ICON.coin, style: 'width:64px;height:64px;margin:6px auto;display:grid;place-items:center' });
      const card = h('div', { class: 'lootcard new', role: 'button', tabindex: '0' }, pic, h('div', { class: 'lname' }, giftName(c)), h('div', { class: 'ltag' }, giftTag(c)));
      const pick = () => { if (done) return; done = true; G.audio.sfx('special'); G.ui.closePanel(); res(c); };
      card.addEventListener('click', pick); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pick(); });
      return card;
    });
    G.ui.panel({ title, color: 'orange', body: [h('div', { class: 'txt' }, line), h('div', { class: 'lootgrid' }, ...cards)] });
  });
}
// the chosen one is yours: a padlock to the 털기 count, a thing to your things (hide it at home), a piece to the 보관함.
// Returns the line that says where it went.
export function grantGift(G, c) {
  const S = G.save;
  if (c.kind === 'lock') { const R = S.raid || (S.raid = {}); R.locksOwned = Math.min(LOCK_MAX, locksOwned(S) + 1); G.persist(); return `자물쇠 ${R.locksOwned}개째! 숨기기에서 서랍을 잠가 봐`; }
  if (c.kind === 'thing') { G.collect(c.t); S.seen = [...new Set([...(S.seen || []), c.t])]; G.persist(); return `${ITEMS[c.t]?.name || ''} · 숨기기에서 집에 숨겨 봐`; }
  if (c.kind === 'decor') { S.home.inventory.push(c.t); G.persist(); return `${FURN_INFO[c.t]?.name || ''} · 꾸미기 보관함에 들어갔어`; }
  G.addCoins(c.n); return `코인 ${c.n}개!`;
}
// the 별 상자s waiting (each 15 stars): one of three each, in a row (at most 3 at once) — from the stage result's 🎁 상자 열기
// or the lobby's 🎁 별 상자; no trip to the room (10/20: no scene between the stages)
export async function openStarGifts(G) {
  const H = G.save.home;
  for (let k = 0; k < 3 && starBoxState(G.save).pending > 0; k++) {
    const n = H.starBoxOpened || 0, c = await giftPanel(G, giftChoices(G.save, n), { title: '별 상자!', line: '별 15개를 모았어! 하나 골라' });
    H.starBoxOpened = n + 1;
    G.ui.toast(grantGift(G, c), 'green');
  }
  G.persist();
}

// 놀이 보상 카드와 결과창의 도감 그림 줄 (경제·로비 세션 10/19 — 사용자, 폰으로 1~10판: "게임이라고 리워드가 없으니 이상",
// "미니게임에서 뭐 리워드를 줘야지"). A won 놀이 shows who gives the reward and why — the friend's face and one line from
// 스토리 룸's GAME_GIFT, the first win only (말 줄이기) — then its stars, the coins and the magnifier; a stage's result shows
// the things found for the first time as pictures with a NEW stamp instead of the words '도감 +3'.
import { h, ICON } from './ui.js';
import { GAME_GIFT } from './script.js';
import { tr } from './i18n.js';
import { CHAR_DEFS } from './gfx/chars.js';
import { lensPlus } from './lens.js';

let css = false;
function style() {
  if (css) return; css = true;
  const s = document.createElement('style');
  s.textContent = `.giftrow{display:flex;align-items:center;gap:10px;text-align:left;background:#fffaf2;border:3px solid #f1e2d0;border-radius:18px;padding:8px 12px;margin:2px 0 10px}
.giftrow img{width:58px;height:58px;flex:none;border-radius:50%;background:#fff;border:3px solid #ffd6a8}
.giftrow b{display:block;font-size:13px;color:#c0577f;line-height:1.2}
.giftrow span{font-size:17px;line-height:1.3;word-break:keep-all}
.giftcard .stars{margin:0 0 4px}
.giftcard .stars .st{width:54px;height:54px}
.giftcard .stars .st:nth-child(2){width:66px;height:66px;margin-top:-10px}
.gstars{position:relative}
.bestmark{position:absolute;right:4px;top:-4px;transform:rotate(12deg);background:#ff6f91;color:#fff;border:2px solid #fff;border-radius:10px;padding:3px 8px;font-size:13px;box-shadow:0 2px 0 rgba(42,26,61,.2);animation:pop .35s .4s both}
.gline{font-size:15px;color:#6b4f86;margin:0 0 6px}
.seenrow{margin:6px 0 2px;text-align:center}
.seenrow b{display:block;font-size:13px;color:#8a6a9a;margin-bottom:4px}
.seenicons{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.seenicons .seen{position:relative;width:44px;height:44px;background:#fff;border:2px solid #f1e2d0;border-radius:12px;animation:pop .35s both}
.seenicons .seen img{width:40px;height:40px;object-fit:contain;margin:2px}
.seenicons .seen i{position:absolute;right:-6px;top:-7px;font-style:normal;font-size:9px;line-height:1;background:#ff6f91;color:#fff;border-radius:999px;padding:2px 4px}`;
  document.head.append(s);
}

// which GAME_GIFT line a game gives: yasik by night (0·1·2), the flashlight boss apart, 보물 지키기 = treasure
export const giftKey = (kind, lv = 0, boss = false) => kind === 'yasik' ? 'yasik' + (lv || 0) : kind === 'lamp' && boss ? 'lampboss' : kind;
// the giver's face and line, the first time this game is won (null after that, or when there is no line)
export function giftRow(G, key) {
  const L = GAME_GIFT[key]; if (!L) return null;
  const seen = G.save.giftSeen || (G.save.giftSeen = {}); if (seen[key]) return null;
  seen[key] = 1; G.persist(); style();
  return h('div', { class: 'giftrow' }, G.thumbs['face_' + L.who] ? h('img', { src: G.thumbs['face_' + L.who] }) : '',
    h('div', {}, CHAR_DEFS[L.who] ? h('b', {}, CHAR_DEFS[L.who].name) : '', h('span', {}, tr(L.text))));
}
const starRow = n => h('div', { class: 'stars' }, ...[0, 1, 2].map(i => h('div', { class: 'st' + (i < n ? ' on' : ''), html: ICON.star })));
// a 쉬어가기 / boss game won (bossgame.js finish, after the game's own end panel): the reward, then on to the next stage
// (실험실 10/19: in the campaign a won game skips its own result panel, so this card is the result — the game's line under
// the stars, a '최고 기록!' stamp past the best stars before, and a small '다시' under three stars). Resolves 'next' | 'retry'.
export function giftCard(G, { key, title, st = 0, coins = 0, lens = false, line = null, retry = false }) {
  style();
  const best = G.save.gameBest || (G.save.gameBest = {}), prev = best[key], record = prev != null && st > prev;
  if (prev == null || st > prev) { best[key] = st; G.persist(); }
  return new Promise(res => {
    const row = giftRow(G, key);
    const reward = h('div', { class: 'reward', html: ICON.coin }, `+${coins}`);
    G.ui.panel({ title, color: 'green', cls: 'giftcard', body: [...(row ? [row] : []), h('div', { class: 'gstars' }, starRow(st), ...(record ? [h('div', { class: 'bestmark' }, '최고 기록!')] : [])),
      ...(line ? [h('div', { class: 'txt gline' }, tr(line))] : []), reward, ...(lens ? [lensPlus()] : [])],
      buttons: [...(retry ? [G.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => { G.ui.closePanel(); res('retry'); } })] : []),
        G.ui.btn('다음 판', { color: 'green', icon: 'play', cls: 'big', onClick: () => { G.ui.closePanel(); res('next'); } })] });
    G.audio?.sfx?.('coin');
  });
}
// the stage result's card-book line: the things found here for the first time (save.seen), as pictures
export function seenRow(G, types) {
  style();
  return h('div', { class: 'seenrow' }, h('b', {}, '도감에 새로'), h('div', { class: 'seenicons' },
    ...types.slice(0, 8).map((t, i) => h('div', { class: 'seen', style: `animation-delay:${.15 + i * .08}s` }, h('img', { src: G.thumbs['item_' + t] || '' }), h('i', {}, 'NEW')))));
}

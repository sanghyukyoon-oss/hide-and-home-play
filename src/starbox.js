// 별 상자 (경제 A1+A2 — reward-loop-20261019.md 7장, 사용자 10/19 "1 ㅇㅇ"): the stars of the stages (each stage's best) and of the
// 판 사이 놀이·보스 (each one's best) fill a bar; every 15 is a box, opened in 몽글이's room — one of three pieces of furniture.
// Bests only, so playing a stage again for its missing star moves the bar and nothing is counted twice. An old save starts
// with one box to open and the rest of its stars on the bar (no backlog of boxes).
import { h, ICON } from './ui.js';
import { FURN_INFO } from './gfx/furniture.js';
import { SHOP_FURN } from './catalog.js';
import { PICK_ITEMS, chapterOfFurn, chapterNow } from './econ.js';

export const STAR_BOX = 15;
// '판 끝 집으로 가져가기' — true: every stage that brought something home passes through the room (검토 세션 10/19);
// false: the room only when a star box is waiting, the things gathered since then shown together, and the stage result
// shows them going home (인수인계 10/19). Which one is the user's call — one switch.
export const PASSAGE_EVERY = false;   // (10/19 evening, user: "방에 그 전시품 그거 개별로야 … 스테이지 끝날 때마다 나오는데 진심 개별로야" — no room pass after every stage; the box visit still shows what came home)

export const starTotal = save => Object.values(save.best || {}).reduce((a, b) => a + (b || 0), 0) + Object.values(save.gameStars || {}).reduce((a, b) => a + (b || 0), 0);
export function starBoxState(save) {
  const H = save.home, total = starTotal(save), earned = Math.floor(total / STAR_BOX);
  if (H.starBoxOpened == null) H.starBoxOpened = Math.max(0, earned - 1);
  return { total, earned, pending: Math.max(0, earned - H.starBoxOpened), into: total % STAR_BOX };
}
// a 판 사이 놀이·보스 won: its best stars; returns how many it added to the bar
export function gameStar(G, key, st) {
  if (G.playMode || G.bot || !G.econ) return 0;
  const S = G.save.gameStars || (G.save.gameStars = {}), prev = S[key] || 0;
  if (st <= prev) return 0;
  S[key] = st; G.persist();
  return st - prev;
}
// the three pieces in box number n: furniture from the chapters reached that you don't have yet, two from this chapter when
// it has them; the same box always shows the same three (no rerolling by reloading). Each piece has its own place in box n's
// order, so a piece bought or set down meanwhile gives way to the next one and the other two stay
export function starBoxThree(save, n) {
  const H = save.home, ch = chapterNow(save), owned = t => H.inventory.includes(t) || Object.values(H.zones).some(z => z.furniture.some(f => f.type === t));
  const ok = SHOP_FURN.filter(it => it.indoor && FURN_INFO[it.type] && (FURN_INFO[it.type].price || 0) >= 120 && !PICK_ITEMS.has(it.type) && !owned(it.type) && chapterOfFurn(it.type) <= ch).map(it => it.type).sort();
  const here = ok.filter(t => chapterOfFurn(t) === ch), rest = ok.filter(t => chapterOfFurn(t) !== ch);
  const rank = t => { let x = (n + 1) * 2654435761 >>> 0; for (let i = 0; i < t.length; i++) x = Math.imul(x ^ t.charCodeAt(i), 16777619) >>> 0; return x; };
  const take = (list, k) => list.slice().sort((p, q) => rank(p) - rank(q)).slice(0, k);
  const a = take(here, 2), b = take([...rest, ...here.filter(t => !a.includes(t))], 3 - a.length);
  return [...a, ...b];
}
let css = false;
function style() {
  if (css) return; css = true;
  const s = document.createElement('style');
  s.textContent = `.starbox{display:flex;align-items:center;gap:8px;margin:6px auto 4px;max-width:250px}
.starbox .sbi{font-size:20px;line-height:1;color:#ffb43a;text-shadow:0 1px 0 rgba(42,26,61,.25)}
.starbox .sbt{flex:1;height:14px;border-radius:999px;background:#efe2d2;border:2px solid #fff;box-shadow:inset 0 1px 0 rgba(0,0,0,.08);overflow:hidden}
.starbox .sbf{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#ffd75e,#ffb43a);transition:width .7s var(--eo,ease)}
.starbox .sbn{font-size:14px;color:#8a6a9a;min-width:46px;text-align:right}
.starbox.full .sbf{background:linear-gradient(90deg,#ff9fb8,#ff6f91)}
.starbox .sbg{font-size:13px;color:#fff;background:#ff6f91;border-radius:999px;padding:2px 8px;animation:pop .35s both}
.homerow{display:flex;align-items:center;justify-content:center;gap:6px;margin:4px 0 2px;font-size:13px;color:#8a6a9a}
.homerow img{width:34px;height:34px;object-fit:contain;background:#fff;border:2px solid #f1e2d0;border-radius:10px;animation:flyhome 1s both}
.homerow .hh{font-size:18px}
@keyframes flyhome{0%{transform:scale(.3);opacity:0}30%{transform:scale(1.1);opacity:1}100%{transform:translateX(10px) scale(.9);opacity:1}}`;
  document.head.append(s);
}
// the bar: from `before` to now (stars), filling over a moment; a box that just came (or waits) shows as 🎁
export function starBar(G, before) {
  style();
  const st = starBoxState(G.save), b0 = before == null ? st.total : before, fill = h('div', { class: 'sbf' }), num = h('div', { class: 'sbn' }, `${b0 % STAR_BOX}/${STAR_BOX}`);
  const el = h('div', { class: 'starbox' }, h('div', { class: 'sbi' }, '★'), h('div', { class: 'sbt' }, fill), num);
  fill.style.width = (b0 % STAR_BOX) / STAR_BOX * 100 + '%';
  const crossed = Math.floor(st.total / STAR_BOX) > Math.floor(b0 / STAR_BOX);
  setTimeout(() => {
    fill.style.width = (crossed ? 100 : st.into / STAR_BOX * 100) + '%';
    num.textContent = crossed ? `${STAR_BOX}/${STAR_BOX}` : `${st.into}/${STAR_BOX}`;
    if (st.pending) { el.classList.add('full'); el.append(h('div', { class: 'sbg' }, st.pending > 1 ? `🎁 ×${st.pending}` : '🎁')); if (crossed) G.audio?.sfx?.('special'); }
  }, 450);
  return el;
}
// (PASSAGE_EVERY off) the stage result's '내 방으로' row: this stage's new friend, piece and find on their way home — no room
// visit until a star box waits, when they are all shown there together
export function homeRow(G, got) {
  style();
  return h('div', { class: 'homerow' }, h('span', {}, '내 방으로'), ...got.slice(0, 4).map((g, i) => h('img', { src: G.thumbs[g.face ? 'face_' + g.face : g.furn ? 'furn_' + g.furn : 'item_' + g.item] || '', style: `animation-delay:${.2 + i * .12}s` })), h('span', { class: 'hh' }, '🏠'));
}

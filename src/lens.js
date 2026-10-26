// 돋보기 가방 (경제 개편 B5, 10/19 — econ-design-20261019.md 5-1). Only with G.econ on (main.js sets it and
// G.save.lens = { bag }): a stage gives 2 free magnifiers that end with it; after those each one comes out of the bag
// (kept between stages, 0..5). No coins inside a stage: the 척척 로봇 and a timed stage's 2nd 이어하기 take one too.
// The bag fills: a clear without a free one used, a won 판 사이 놀이 / boss (+1 each); a stage lost to taps gives back
// the bag's ones it took. With G.econ off none of this runs (the old 3 free + 60 coins path).
import { h } from './ui.js';

// (#90 10/21, user "힌트 여전히 너무 많고" — 판 안 배지가 7개(공짜 2 + 가방 5)였어요; 앞서 "힌트는 1~2개만 처음에"): a stage gave 1, the bag
// held 2 — never more than 3 on the button
// (10/22 밤 사용자 실폰 1.0.184: "힌트는 3개 누적되게 해 줘야지. 판마다 힌트 주면 나머지 3개는 무조건 힌트 써서 하겠다." — ② 레벨):
// no free one a stage any more — the bag is the stock, carried from stage to stage, 3 at most; it fills one every second stage
// cleared, or at once on a ★★★ clear (lensClear). A new save starts with 1 (econ.js)
export const LENS_MAX = 3, LENS_FREE = 0;
export const bagOf = G => { const L = G.save.lens; if (L && L.bag > LENS_MAX) { L.bag = LENS_MAX; G.persist?.(); } return L?.bag ?? 0; };
// n in (or out, n < 0), kept in 0..LENS_MAX; returns how many actually went in (0 when it was full)
export function addBag(G, n) {
  const L = G.save.lens || (G.save.lens = { bag: 0 }), was = L.bag ?? 0;
  L.bag = Math.max(0, Math.min(LENS_MAX, was + n)); G.persist();
  return L.bag - was;
}

// ── in a stage (S = the StageScene)
export const lensLeft = S => Math.max(0, S.hints || 0) + bagOf(S.G);
// the hint button's number: free + bag; once the free ones are gone it turns the bag's colour (style.css .badge.bag)
export function lensBadge(S) {
  const b = S.hintBtn?.badge; if (!b) return;
  b.textContent = lensLeft(S); b.classList.remove('bag');   // (one stock now: the number is what you have, in the button's own colour)
}
// take one, a free one first; one from the bag is remembered (a stage lost to taps gives it back). False when none
export function takeLens(S) {
  let ok = false;
  if (S.hints > 0) { S.hints--; ok = true; }
  else if (bagOf(S.G) > 0) { addBag(S.G, -1); S.bagUsed = (S.bagUsed || 0) + 1; ok = true; }
  lensBadge(S);
  return ok;
}
// (10/26 사용자 실폰: "다쓰고 나서 클릭하면 빤작이로 알려준다는데 힌트가 없습니다 표시만 하게 해줘") — only the line now, no sparkle
export function noLens(S) {
  S.G.ui.toast('돋보기가 없어!', 'red');
}
// the hint button: true when a magnifier was taken (the hint goes on), false when there was none (the sparkle instead)
export function lensHint(S) {
  if (!takeLens(S)) { noLens(S); return false; }
  S.hintsUsed = (S.hintsUsed || 0) + 1;
  return true;
}
// a stage lost to taps: the bag's ones come back (no losing the stage and the bag both). How many came back
export function lensBack(S) {
  const n = S.bagUsed || 0, G = S.G, k = S.custom ? null : S.idx; S.bagUsed = 0;
  if (k != null) { const done = G._lensBack || (G._lensBack = new Set()); if (done.has(k)) return 0; if (n) done.add(k); }   // (the second loss on the same stage: kept — the layout is the same on a retry)
  return n ? addBag(G, n) : 0;
}
// a stage cleared for the first time: every second one puts a magnifier in, a ★★★ one (no magnifier used) at once. A replay or a
// 털기 adds nothing (no filling up on one stage). The result panel's line, or null (none this time, or the bag is full)
export function lensClear(S, stars = 0) {
  const G = S.G;
  if (S.custom || S.idx + 1 <= (G.save.stage || 0)) return null;
  const L = G.save.lens || (G.save.lens = { bag: 0 });
  let add = stars >= 3;
  if (add) L.cnt = 0; else { L.cnt = (L.cnt || 0) + 1; if (L.cnt >= 2) { L.cnt = 0; add = true; } }
  G.persist();
  if (!add || addBag(G, 1) <= 0) return null;
  const n = bagOf(G);
  return stars >= 3 ? `별 셋! 돋보기 +1 (${n}/${LENS_MAX})` : `돋보기 +1 (${n}/${LENS_MAX})`;
}
// 톡 running low (taps.js, 3 left): the hint button bounces once when there is a magnifier to reach for (5-4)
export function lensNudge(S) {
  const b = S.hintBtn; if (!b || S._lensNudge || lensLeft(S) <= 0) return;
  S._lensNudge = true;
  b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge');
  setTimeout(() => b.classList.remove('nudge'), 800);
}

// ── a won 판 사이 놀이 / boss (bossgame.js, mini.js, boss.js): one into the bag, not in 놀이 모음 practice. True when it went in
export const lensGameWin = G => !!G.econ && !G.playMode && addBag(G, 1) > 0;
// "+ 돋보기 1" on its own line under a toast or a reward (its own text node, so the words beside it still translate whole)
export const lensPlus = () => h('div', { class: 'lensplus' }, '+ 돋보기 1');

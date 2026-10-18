// 돋보기 가방 (경제 개편 B5, 10/19 — econ-design-20261019.md 5-1). Only with G.econ on (main.js sets it and
// G.save.lens = { bag }): a stage gives 2 free magnifiers that end with it; after those each one comes out of the bag
// (kept between stages, 0..5). No coins inside a stage: the 척척 로봇 and a timed stage's 2nd 이어하기 take one too.
// The bag fills: a clear without a free one used, a won 판 사이 놀이 / boss (+1 each); a stage lost to taps gives back
// the bag's ones it took. With G.econ off none of this runs (the old 3 free + 60 coins path).
import { h } from './ui.js';

export const LENS_MAX = 5, LENS_FREE = 2;
export const bagOf = G => G.save.lens?.bag ?? 0;
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
  b.textContent = lensLeft(S); b.classList.toggle('bag', S.hints <= 0);
}
// take one, a free one first; one from the bag is remembered (a stage lost to taps gives it back). False when none
export function takeLens(S) {
  let ok = false;
  if (S.hints > 0) { S.hints--; ok = true; }
  else if (bagOf(S.G) > 0) { addBag(S.G, -1); S.bagUsed = (S.bagUsed || 0) + 1; ok = true; }
  lensBadge(S);
  return ok;
}
// none left: never a button that does nothing — the idle sparkle starts now. It counts as a hint (★ 힌트 없이 is gone)
export function noLens(S) {
  S.G.ui.toast('돋보기가 없네! 대신 반짝이로 알려 줄게', '');
  S.hintsUsed = (S.hintsUsed || 0) + 1;
  S.idle = Math.max(S.idle || 0, S.sparkAfter ?? 20); S.twinkleT = 0;   // (stage.js update: it sparkles once idle > sparkAfter)
  // (one thing left on a 숨은그림 판, F1: the sparkle waits for the owner's look — have the look now, no wait after it)
  const left = S.targets.filter(t => !t.found);
  if (S.feelHelp && left.length === 1) { S._oneAt ??= S.t; if (S._gazeAt == null) S.gazeHint(left[0]); S._gazeAt = S.t - 10; }
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
// a clear without a free magnifier used: one into the bag. The result panel's line, or null (one was used, or the bag is full)
export function lensClear(S) {
  const G = S.G;
  if (S.hintsUsed || S.hints < LENS_FREE || addBag(G, 1) <= 0) return null;
  const n = bagOf(G);
  if (!G.save.lens.told) { G.save.lens.told = 1; G.persist(); return `안 쓴 돋보기는 가방에 쏙! (가방 ${n}/${LENS_MAX})`; }
  return `돋보기 가방 +1 (${n}/${LENS_MAX})`;
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

// 두 번 톡 확대 수업 (user 10/19: "더블클릭하면 확대되는거 튜토리얼으로 알려줘야할거같아"): in 2판 (the things tutorial), once —
// after two taps on nothing, or 15 s without a find — a hand double-taps on the room with one short line; the first time
// you really do it, a small "새로 얻었다!" toast. It takes the place of 2판's old pinch tip (DO.zoom), so 2판 still teaches
// two things (drawers, this); the tilt lesson is off here (its loft star is seen by turning alone — 레벨 점검 10/19),
// ?tilt=1 brings it back. ?dbl=0 → the old pinch tip.
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
export const DBL_ON = typeof location === 'undefined' || !/[?&]dbl=0(&|$)/.test(location.search);
export const TILT_ON = typeof location !== 'undefined' && /[?&]tilt=1(&|$)/.test(location.search);
// (문구: 스토리 룸 10/19 — 동작 이름을 '톡톡'으로 붙여 게임의 '톡'과 한 식구로, 배지는 '기술을 얻었다'로 읽히게)
export const DBL_TXT = {
  tip: K('콕콕! 두 번 누르면 크게 보여', 'Tap-tap! Double-tap to zoom in.'),
  more: K('같은 자리를 빠르게 콕콕', 'Same spot, two quick taps.'),
  got: K('새로 얻었다! 콕콕 = 크게 보기 · 또 콕콕 = 원래대로', 'New move! Double-tap to zoom in · again to zoom out.'),
};

export async function teachDbl(S) {
  const G = S.G, W = G.world;
  if (!DBL_ON || S._dbl || G.save.tut?.dbl || S.result || S.dead || S.botOn?.()) return;
  S._dbl = true;
  while (S.tutEls && !S.dead && !S.result) await S.tw.wait(.5);   // (never over another lesson's hand)
  if (S.dead || S.result) return;
  const z0 = W.zoom;
  // (v122 QA3-dbl6: a double tap zooms only where a tap does nothing — not on a drawer, a door or a friend) so the hand
  // goes to the nearest bare spot to the middle of the room, looked for again now and then as the view moves
  let spot = null, at0 = -9;
  const find = () => {
    const cx = W.W / 2, cy = W.H * .46;
    for (let r = 0; r <= 150; r += 30) for (let a = 0; a < (r ? 8 : 1); a++) {
      const x = cx + r * Math.cos(a * Math.PI / 4), y = cy + r * Math.sin(a * Math.PI / 4);
      if (S.tapIdle ? S.tapIdle(x, y) : true) return { sx: x, sy: y };
    }
    return { sx: cx, sy: cy };
  };
  const at = () => { if (!spot || S.t - at0 > 1) { spot = find(); at0 = S.t; } return spot; };
  // (외부 QA 10/20 ST-DBL-CONSUMED) learnt only by a double tap that zoomed in — not a pinch, not the lesson timing out or the
  // stage ending: those leave it to be taught again the next time 3판 is played (S._dbl keeps it to once a play)
  let dbl = false; const prev = W.onDoubleTap;
  W.onDoubleTap = (x, y) => { prev?.(x, y); if (W.zoom <= 1.8) dbl = true; };
  const ok = await S.teach(tr(DBL_TXT.tip), 'dtap', at, () => W.zoom > z0 + .6 || (W.zoomGoal?.z ?? 0) > z0 + .6, DBL_TXT.more, 20);
  if (!S.dead) W.onDoubleTap = prev;
  if (!ok || !dbl) return;
  (G.save.tut || (G.save.tut = {})).dbl = 1; G.persist?.();
  G.ui.toast(tr(DBL_TXT.got), 'green');
}

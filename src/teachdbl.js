// 두 번 톡 확대 안내 (user 10/19: "더블클릭하면 확대되는거 튜토리얼으로 알려줘야할거같아"; 10/21: "한 번만 그냥 공지하는 걸로"): in
// 3판, once — after two taps on nothing, or 15 s without a find — one short toast, and never again (save.tut.dbl). It takes the place of 2판's old pinch tip (DO.zoom), so 2판 still teaches
// two things (drawers, this); the tilt lesson is off here (its loft star is seen by turning alone — 레벨 점검 10/19),
// ?tilt=1 brings it back. ?dbl=0 → the old pinch tip.
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
export const DBL_ON = typeof location === 'undefined' || !/[?&]dbl=0(&|$)/.test(location.search);
export const TILT_ON = typeof location !== 'undefined' && /[?&]tilt=1(&|$)/.test(location.search);
// (문구: 스토리 룸 10/19 — 동작 이름을 '톡톡'으로 붙여 게임의 '톡'과 한 식구로, 배지는 '기술을 얻었다'로 읽히게)
export const DBL_TXT = {
  tip: K('두 번 터치하면 크게 보여!', 'Tap-tap! Double-tap to zoom in.'),
  more: K('같은 자리를 빠르게 두 번 터치', 'Same spot, two quick taps.'),
  got: K('새로 얻었다! 두 번 터치 = 크게 보기 · 또 두 번 터치 = 원래대로', 'New move! Double-tap to zoom in · again to zoom out.'),
};

// (10/21, user: "2번 터치하면 크게 보이는 거 한 번만 그냥 공지하는 걸로.") no hand lesson any more: the first time it's due (3판, two
// taps on nothing or 15 s without a find) one short toast, and it is marked seen in the save — never again, whether or not
// you tried it. Double-tap zoom itself is unchanged
export async function teachDbl(S) {
  const G = S.G;
  if (!DBL_ON || S._dbl || G.save.tut?.dbl || S.result || S.dead || S.botOn?.()) return;
  S._dbl = true;
  while ((S.tutEls || S.t - (S._tutEnd ?? -9) < 1.5) && !S.dead && !S.result) await S.tw.wait(.5);   // (not over another lesson, and 1.5 s after one — 레벨 10/20)
  if (S.dead || S.result) return;
  (G.save.tut || (G.save.tut = {})).dbl = 1; G.persist?.();
  G.ui.toast(tr(DBL_TXT.tip), 'green');
}

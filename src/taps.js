// 톡 횟수 (레벨 세션 10/18 밤; user: "긴장감이 없다고 찾는 버튼 누르는 횟수를 제한 두라는데… 나도 결국 광클하게 되는 거 같아",
// "횟수 제한 두는 게 나을 거 같아. 그래서 트라이어게인 뜨는 게 나을 듯"). Each stage gives a number of wasted taps (a hand
// at the top left); it goes down on a tap that finds nothing — the bare floor, a decoy, the body of a piece of furniture,
// a door or drawer opened on nothing — and never on a tap that finds, opens something with a thing in it, or that a lock
// answers. At 0 the stage is lost: "다시 하기". Not on the two tutorials, 너굴이's timed stages or someone else's room.
// (The name isn't 돋보기: that's the hint button.)
import { EN } from './i18n-en-dict.js';
import { REGIONS, regionOf } from './stages.js';
import { h, ICON } from './ui.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
export const TAP_TXT = {
  title: K('톡을 다 썼어!', 'Out of taps!'),
  body: K('아무 데나 누르면 톡이 줄어. 잘 보고 눌러 보자!', 'Every tap on nothing uses one up. Look first, then tap!'),
  intro: K('빈 바닥이나 엉뚱한 걸 누르면 왼쪽 위 손가락 수가 줄어. 서랍·문 열기는 괜찮아. 다 쓰면 처음부터!', 'Tapping the floor or the wrong thing uses up the hand count at the top left. Opening drawers and doors is free. Run out and you start over!'),
  low: K('톡이 얼마 안 남았어! 잘 보고 눌러', 'Only a few taps left! Look before you tap'),
  star: K('★ 톡 절반 남기기', '★ Half the taps left'),
  friend: K('헤헤, 못 찾았지?', "Hehe, couldn't find me?"),
};

// how many: 6 to start with, one per thing to find, two per lock or device step, four more on a big map; roomier in the
// first chapters, a little more on an escape-room boss, never under 10. Tune here.
const PER_CHAPTER = [1.5, 1.3, 1.15, 1, 1, 1, 1];
export function tapBudget(S) {
  const sp = S.spec;
  if (S.custom || S.preview || sp.tut === 1 || sp.tut === 2 || sp.timed) return null;
  const ch = Math.min(6, Math.max(0, REGIONS.indexOf(regionOf(sp.idx ?? S.idx))));
  const n = S.targets.length, L = S.plan.locks.length;
  const area = (S.room.rooms || [S.room]).reduce((a, R) => a + (R.w || 5) * (R.d || 5), 0);
  const big = area > 40 ? 4 : 0;
  return Math.max(10, Math.round((6 + n + 2 * L + big) * PER_CHAPTER[ch] * (sp.boss ? 1.2 : 1)));
}

// the hand in the corner (first in the row of key / code pills)
export function tapsSetup(S) {
  const G = S.G;
  S.tapBudget = tapBudget(S); S.tapsLeft = S.tapBudget;
  if (S.tapsLeft == null) return;
  const p = S.tapPill = h('div', { class: 'pill taps', html: `<span class="ico">${ICON.hand}</span><span class="v">${S.tapsLeft}</span>` });
  S.inv.prepend(p);
  if (!G.bot && !G.save.seenTaps) {
    G.save.seenTaps = 1; G.persist?.();
    // (after the opening talk, never over a dialog card — 검토 재검토 6)
    const show = () => { if (S.dead || S.result) return; if (S.talking || !S.running) return setTimeout(show, 600); G.ui.toast(TAP_TXT.intro, ''); };
    setTimeout(show, 2600);
  }
}
// a thing to find, a clue or the friend is still in there (a decoy doesn't count)
export const somethingIn = part => part.spots.some(s => s.item && !s.item.found && s.item.role !== 'decoy');
// one tap that found nothing
export function spendTap(S, x, y) {
  if (S.tapsLeft == null || S.result || !S.running) return;
  const G = S.G, p = S.tapPill;
  S.tapsLeft = Math.max(0, S.tapsLeft - 1);
  if (p) {
    p.querySelector('.v').textContent = S.tapsLeft;
    p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop');
    p.classList.toggle('need', S.tapsLeft <= 3);
  }
  if (x != null) G.ui.floatText(x, y - 34, '-1', 'red');
  if (S.tapsLeft === 3 && !S._tapLow) { S._tapLow = true; G.ui.toast(TAP_TXT.low, 'red'); }
  if (S.tapsLeft <= 0) S.lose('taps');
}
// the hidden-object stage's third star: at least half the taps left (it was "no more wrong taps than things to find")
export const tapsStarOk = S => (S.tapsLeft == null ? S.missCount <= S.targets.length : S.tapsLeft * 2 >= S.tapBudget);

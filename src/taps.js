// 톡 횟수 (레벨 세션 10/18 밤; user: "긴장감이 없다고 찾는 버튼 누르는 횟수를 제한 두라는데… 나도 결국 광클하게 되는 거 같아",
// "횟수 제한 두는 게 나을 거 같아. 그래서 트라이어게인 뜨는 게 나을 듯"). Each stage gives a number of wasted taps (a hand
// at the top left); it goes down on a tap that finds nothing — the bare floor, a decoy, the body of a piece of furniture,
// a door or drawer opened on nothing — and never on a tap that finds, opens something with a thing in it, or that a lock
// answers. At 0 the stage is lost: "다시 하기". Not on the two tutorials, 너굴이's timed stages or someone else's room.
// (The name isn't 돋보기: that's the hint button.)
import { EN } from './i18n-en-dict.js';
import { REGIONS, regionOf } from './stages.js';
import { h, ICON } from './ui.js';
import { lensNudge } from './lens.js';   // 경제 B5 (10/19)

const K = (ko, en) => { EN[ko] = en; return ko; };
export const TAP_TXT = {
  title: K('톡을 다 썼어!', 'Out of taps!'),
  body: K('아무 데나 누르면 톡이 줄어. 잘 보고 눌러 보자!', 'Every tap on nothing uses one up. Look first, then tap!'),
  free: K('서랍·문은 공짜!', 'Drawers and doors are free!'),   // (the one line the tap rule still says: on the first tap stage's second miss)
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
  // taught by hand, not said (1~10판 기획안 C3, 10/19): no opening toast. The first stage with taps marks its first miss — the
  // count wobbles — and says one short thing on the second: drawers and doors are free (3 left: the count breathes red)
  if (!G.bot && !G.save.seenTaps) { G.save.seenTaps = 1; G.persist?.(); S._tapTeach = 1; }
}
// a thing to find, a clue or the friend is still in there (a decoy doesn't count)
export const somethingIn = part => part.spots.some(s => s.item && !s.item.found && s.item.role !== 'decoy');
// one tap that found nothing
export function spendTap(S, x, y) {
  if (S.tapsLeft == null || S.result || !S.running) return;
  if (S.targets.every(t => t.found)) return;   // (QA 10/18: everything found, the win is on its way — a stray tap there lost a won stage)
  const G = S.G, p = S.tapPill;
  S.tapsLeft = Math.max(0, S.tapsLeft - 1);
  const teach = S._tapTeach || 0; if (teach) S._tapTeach++;
  if (p) {
    p.querySelector('.v').textContent = S.tapsLeft;
    p.classList.remove('pop', 'shake'); void p.offsetWidth; p.classList.add(teach === 1 ? 'shake' : 'pop');
    p.classList.toggle('need', S.tapsLeft <= 3);
  }
  // the -1 rises off the count itself (what went down, and where), a little dust where the finger landed
  const r = p?.getBoundingClientRect();
  if (r?.width) G.ui.floatText(r.right + 14, r.top + r.height / 2, '-1', 'red'); else if (x != null) G.ui.floatText(x, y - 34, '-1', 'red');
  if (x != null) { G.world.fx.burst(x, y, { n: 7, shape: 'dot', colors: ['#efe4d2', '#d6c8b2', '#fffaf0'], speed: 90, size: 8, life: .45, gravity: -40 }); G.world.fx.ring(x, y, { r: 20, color: 'rgba(255, 250, 240, .85)', width: 3, life: .3 }); }
  if (teach === 2) G.ui.toast(TAP_TXT.free, '');
  if (S.tapsLeft === 3 && !S._tapLow) { S._tapLow = true; G.ui.toast(TAP_TXT.low, 'red'); }
  if (G.econ && S.tapsLeft === 3) lensNudge(S);   // 경제 B5 (10/19): a magnifier in hand → the hint button bounces once (설계서 5-4)
  // (QA 10/18: a moment's wait — this may be the first tap of a double-tap zoom, which gives the tap back; at 1 left the
  // zoom used to end the stage before the second tap came)
  if (S.tapsLeft <= 0 && S._tapLoseAt == null) S._tapLoseAt = (S._tapClock || 0) + .36;
}
// the hidden-object stage's third star: at least half the taps left (it was "no more wrong taps than things to find")
export const tapsStarOk = S => (S.tapsLeft == null ? S.missCount <= S.targets.length : S.tapsLeft * 2 >= S.tapBudget);

// 끌다가 톡 회전 수업 (user 10/19: "화면 톡해서 이동 중에 잠시 회전 가능한 것 설명 안 된 듯"): the dial and moving are taught
// in 1판; turning while you drag (a second finger taps → the drag turns the room until you lift) had no lesson.
// From 2판 (user 10/19 night: "튜토리얼에 꼭", "약간 더 이르게" — 1판 already has three hands, so its first stage after) —
// once, in the 기본(F) controls — after you have moved the view a little (150 px of dragging, 3 s in) a hand drags with a
// second fingertip tapping beside it, with one short line (DO.ftap) — or sooner, when it is needed: nothing left to find
// shows from where the view is and nothing has been found for 8 s (레벨 1~10 10/19: 2판 is the first stage with a thing
// seen only by turning — the star on the loft; "필요할 때 새로 얻었다"). The moment the turn takes, the line says what it
// turns round (DO.ftapOn — the cross in the middle); the first time you really turn that way, a small "새로 얻었다!" toast. Doing it yourself before the lesson counts as
// learned. A lesson that ran out (22 s) or was cut short by the stage ending isn't: it comes back on a later stage, three
// times at most (GPT QA R2-08 10/19). Not in timed, boss, custom or model-kit stages (the 프라모델 tab's S.model and the
// stages' own kits, S.kit). ?ftapteach=0 → off.
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';
import { DO } from './script.js';   // (the lesson's two lines are the 스토리 룸's: DO.ftap, DO.ftapOn)

const K = (ko, en) => { EN[ko] = en; return ko; };
export const FTAP_ON = typeof location === 'undefined' || !/[?&]ftapteach=0(&|$)/.test(location.search);
// (문구 초안: 조작감 세션 10/19 — 스토리 룸이 고쳐 주세요)
export const FTAP_TXT = {
  tip: K('끌면서 다른 손가락으로 톡! 그대로 끌면 방이 빙글', 'Drag, then tap with another finger. Keep dragging to spin the room!'),
  more: K('한 손가락은 그대로 두고, 다른 손가락으로 톡!', 'Keep one finger down and tap with another!'),
  got: K('새로 얻었다! 끌다가 톡 → 빙글 · 손 떼면 다시 이동', 'New move! Drag + tap to spin · Let go to move again'),   // (문구: 스토리 룸 10/19)
};

// a drag that a second-finger tap turned into a turn (not the dial, not the 회전 badge of the E controls)
const fturning = W => W.eMode === 'turn' && W.eBase !== 'turn' && W.ptrs.size > 0 && !W._tdHeld;

export function armFtap(S) {
  const G = S.G, W = G.world;
  if (!FTAP_ON || G.save.tut?.ftap || (G.save.tut?.ftapN || 0) >= 3 || W.scheme !== 'F' || S.idx < 1 || S.custom || S.model || S.kit || S.preview || S.spec.timed || S.spec.boss || S.botOn?.()) return;
  const learned = () => { (G.save.tut || (G.save.tut = {})).ftap = 1; G.persist?.(); };
  let pan = 0, on = false;
  const st = { turned: 0 };   // how far the room has turned by a drag-then-tap (counted as it happens, not by the frame)
  const prevPan = W.onPan, prevRot = W.onRotate;
  W.onPan = d => { prevPan?.(d); pan += Math.abs(d) || 0; if (!on && pan > 150 && S.t - (S.tStart ?? 0) > 3) { on = true; teachFtap(S, learned, st); } };
  W.onRotate = d => { prevRot?.(d); if (!fturning(W)) return; st.turned += Math.abs(d) || 0;
    if (!st.said) { st.said = true; if (st.live && S.tutEls?.[0]) S.tutEls[0].textContent = tr(DO.ftapOn); else if (!G.save.tut?.ftap) G.ui.toast(tr(DO.ftapOn), ''); }   // the turn took: what it turns round
    if (!on) { on = true; learned(); }   // found it alone: no lesson
    else if (!st.live && st.turned > .35 && !G.save.tut?.ftap) learned(); };   // (after a lesson that ran out: done alone later)
  // needed now: every thing still to find is out of sight from this view, and nothing found for 8 s
  (async () => {
    while (!on && !S.dead && !S.result) {
      await S.tw.wait(1);
      if (on || S.dead || S.result || !S.running || S.paused || S.tutEls || W.ptrs.size || (S.idle || 0) < 8) continue;
      // (a thing shut in a drawer or behind a door is found by opening, not by turning: it doesn't count)
      const left = S.targets.filter(t => !t.found && t.g && !(t.spot?.part && t.spot.part.t < .5));
      if (left.length && !left.some(t => W.visibleAt?.(t.g, S.worldCenter(t), [S.room.group, ...(S.friend ? [S.friend.root] : [])]))) { on = true; teachFtap(S, learned, st); }
    }
  })();
}

async function teachFtap(S, learned, st) {
  const G = S.G, W = G.world;
  while (S.tutEls && !S.dead && !S.result) await S.tw.wait(.5);   // (never over another lesson's hand)
  if (S.dead || S.result || G.save.tut?.ftap) return;
  // the hand drags across the open middle of the room (clear of the list at the top and the dial at the bottom right)
  const at = () => ({ sx: W.W * .42, sy: W.H * .54 });
  st.turned = 0;
  const done = () => st.turned > .35;   // ~20° turned that way
  const T = G.save.tut || (G.save.tut = {}); T.ftapN = (T.ftapN || 0) + 1; G.persist?.();   // (shown: three times at most)
  st.live = true;
  const ok = await S.teach(tr(DO.ftap), 'ftap', at, done, FTAP_TXT.more, 22);
  st.live = false;
  if (!ok) return;   // ran out or the stage ended: not learned — again on a later stage
  learned();
  G.ui.toast(tr(FTAP_TXT.got), 'green');
}

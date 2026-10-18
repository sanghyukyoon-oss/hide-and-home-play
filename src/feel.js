// 손맛 (2026-10-18, user: "조작감이 ㅈㄴ게 좋았으면 좋겠거든"): eight control-feel changes, tried one by one on the phone in
// the feel lab and kept together ("80점은 된 거 같아"). Each stays a switch so it can be compared again: ?feel=0 turns them
// all off (like ?opt=0 for the heat savings).
//   fat       a near miss takes the thing to find within 22 px of its tap area (a fingertip is ~44 px; small things were 28–34)
//   haptic    a tick on finds, misses, drawers, mode switches, diagonal views (iPhone: iOS 18's switch tick; Android: vibrate)
//   catchup   a drag takes the first 9 px too, so the spot under the finger stays under it
//   rubber    past the edge the view gives a little and settles back in ~0.2 s, instead of stopping dead
//   pinch     a pinch catches up its first 16 px and carries the spot between the fingers (photo-app pinch)
//   hold      a finger resting on the glass keeps the full frame rate
//   press     what the finger presses dips a little and pops back (drawn only)
//   cleanturn no stop-then-jump near the four diagonal views (a tick is felt instead)
export const FEEL = {};
{
  const off = typeof location !== 'undefined' && new URLSearchParams(location.search).get('feel') === '0';
  for (const k of ['fat', 'haptic', 'catchup', 'rubber', 'pinch', 'hold', 'press', 'cleanturn']) FEEL[k] = !off;
}

// ── haptics. iPhone Safari has no navigator.vibrate; since iOS 18 a click on a <input type=checkbox switch> label
// plays the system's switch tick, and that is the only haptic a web page can reach there. It must run inside a touch
// (the tap's pointerup is one), so a tick fired long after the finger lifted may stay silent.
const IOS = typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
function tick1() {
  try {
    if (navigator.vibrate) { navigator.vibrate(12); return; }
    if (!IOS) return;
    const lab = document.createElement('label'); lab.ariaHidden = 'true'; lab.style.display = 'none';
    const inp = document.createElement('input'); inp.type = 'checkbox'; inp.setAttribute('switch', '');
    lab.append(inp); document.head.append(lab); lab.click(); lab.remove();
  } catch {}
}
let lastBuzz = 0;
// kind: 'tick' one tap, 'ok' two (found), 'bad' three (dizzy)
export function haptic(kind = 'tick') {
  if (!FEEL.haptic) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;   // before the first touch the browser refuses anyway
  const now = performance.now(); if (now - lastBuzz < 60) return; lastBuzz = now;
  if (navigator.vibrate) { navigator.vibrate(kind === 'ok' ? [14, 70, 22] : kind === 'bad' ? [16, 60, 16, 60, 16] : 12); return; }
  tick1();
  if (kind === 'ok') setTimeout(tick1, 110);
  if (kind === 'bad') { setTimeout(tick1, 100); setTimeout(tick1, 200); }
}
// which sounds also buzz (sounds that only come from a tap; timers, voices and ambience never do)
const BUZZ = {
  found: 'ok', special: 'ok', coin: 'ok', star: 'ok', unlock: 'ok', win: 'ok',
  dizzy: 'bad',
  miss: 'tick', wobble: 'tick', drawer: 'tick', open: 'tick', close: 'tick', lift: 'tick', locked: 'tick', door: 'tick', place: 'tick', pop: 'tick', btn: 'tick', tap: 'tick',
};
// the faintest buzz there is (the turn ratchet): 3 ms on Android, the system's light tick on iPhone, at most ~8 a second
let lastLight = 0;
export function hapticLight() {
  if (!FEEL.haptic) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  const now = performance.now(); if (now - lastLight < 120) return; lastLight = now;
  try { if (navigator.vibrate) { navigator.vibrate(3); return; } } catch {}
  tick1();
}
export function hapticFor(sound) { const k = BUZZ[sound]; if (k) haptic(k); }

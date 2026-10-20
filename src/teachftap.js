// 끌다가 터치 회전 수업 — 다시 짬 (10/20 저녁, user on the phone: "끌면서 다른 손가락으로 콕? 최악의 튜토 멘트랑 UI다. 뭔 소리일까 …
// 이거 핵심 기능 중 하나라 잘 설명되면 좋겠어서", "힌트가 너무 많아"). No tap circle: two see-through hands do it on the real
// room — the first finger drags and the room slides with it, the second finger touches once (a ring, the '+' the turn goes
// round), the first finger keeps going the same way and now the room spins round the '+'. The side buttons step aside while
// it plays (레벨 세션: every lesson), and no other lesson shows.
// (then, user: "끄는 손 떼지 말라고 해 줘야 할 듯. 계속 유지하면서 한 번 터치해 보세요. 이제 이동으로 바뀌어요 이런 식으로 좀.. 최대한
// 자세히") one short line per step, at the top where every lesson's line is, and a "떼지 마세요" tag over the first finger
// while it is down — in the play, and then following your own fingers: one finger down → keep it there and touch with
// another; the turn took → now dragging spins; you let go → back to moving. The moment you do it (~20° turned that way) it
// ends on "새로 얻었다!". Doing it alone, before or without the lesson, counts the same.
// When: from 2판, after you've moved the view a little (150 px of dragging, 3 s in), or sooner when it's needed (nothing left
// to find shows from here and nothing found for 8 s) — and only while no finger is on the glass: a touch stops it at once.
// Two plays a stage (the second the mirror of the first, so the view ends where it was), on up to three stages until you've
// done it. Not in timed, boss, custom or model-kit stages (S.model, S.kit). ?ftapteach=0 → off.
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';
import { h, ICON } from './ui.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
export const FTAP_ON = typeof location === 'undefined' || !/[?&]ftapteach=0(&|$)/.test(location.search);
export const FTAP_TXT = {
  got: K('새로 얻었다! 방 빙글 돌리기', 'New move: spin the room!'),   // (문구: 스토리 룸 10/20)
};
const PIV = '<svg viewBox="0 0 26 26" width="26" height="26"><path d="M13 4v18M4 13h18" stroke="rgba(58,36,83,.5)" stroke-width="5.5" stroke-linecap="round"/><path d="M13 4v18M4 13h18" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>';   // (world.js's own turn '+')

// a drag that a second-finger touch turned into a turn (not the dial, not the 회전 badge of the E controls)
const fturning = W => W.eMode === 'turn' && W.eBase !== 'turn' && W.ptrs.size > 0 && !W._tdHeld;

export function armFtap(S) {
  const G = S.G, W = G.world;
  if (!FTAP_ON || W.scheme !== 'F' || S.idx < 1 || S.custom || S.model || S.kit || S.preview || S.spec.timed || S.spec.boss || S.botOn?.()) return;
  if (G.save.tut?.ftap) return refresh(S);
  const st = { turned: 0, on: false };
  const prevPan = W.onPan, prevRot = W.onRotate;
  const begin = () => { if (st.on || (G.save.tut?.ftapN || 0) >= 3) return; st.on = true; demo(S, st); };
  W.onPan = d => { prevPan?.(d); st.pan = (st.pan || 0) + (Math.abs(d) || 0); if (st.pan > 150 && S.t - (S.tStart ?? 0) > 3) begin(); };
  // done it: a real drag-then-touch turn of ~20° — the one place with words
  W.onRotate = d => { prevRot?.(d); if (!fturning(W) || G.save.tut?.ftap) return; st.turned += Math.abs(d) || 0;
    if (st.turned < .35) return;
    const T = G.save.tut || (G.save.tut = {}); T.ftap = 1; T.ftapIdle = 0; G.persist?.(); st.on = true; st.got = true;
    // the "새로 얻었다!" waits for the lift (스토리 룸 10/20: not on top of "됐다!") — in a lesson, after ④ too
    if (!st.live) (async () => { while (W.ptrs.size && !S.dead) await S.tw.wait(.1); if (!S.dead) got(S); })(); };
  // needed now: every thing still to find is out of sight from this view, and nothing found for 8 s
  (async () => {
    while (!st.on && !S.dead && !S.result) {
      await S.tw.wait(1);
      if (st.on || S.dead || S.result || !S.running || S.paused || S.tutEls || W.ptrs.size || (S.idle || 0) < 8) continue;
      // (a thing shut in a drawer or behind a door is found by opening, not by turning: it doesn't count)
      const left = S.targets.filter(t => !t.found && t.g && !(t.spot?.part && t.spot.part.t < .5));
      if (left.length && !left.some(t => W.visibleAt?.(t.g, S.worldCenter(t), [S.room.group, ...(S.friend ? [S.friend.root] : [])]))) begin();
    }
  })();
}

// 한 번 더 (10/20 밤, user: "뒤쪽 가서도 이동 중 터치해서 잠시 회전 안 쓰면 튜토 한 번 더 내보낼 수 있어?"): once learned, every
// stage (the same stages as the lesson) counts as unused until a drag-then-touch turn happens in it — the dial or a two-finger
// twist doesn't count, it's this move we remind of. Three stages in a row unused → at the start of the next one, one short
// play with lines ② ③ only (no ① ④, no coaching after). Once; never again after that.
function refresh(S) {
  const G = S.G, W = G.world, T = G.save.tut;
  if (T.ftapRe) return;
  const idle = T.ftapIdle || 0;
  T.ftapIdle = idle + 1; G.persist?.();
  const prevRot = W.onRotate;
  W.onRotate = d => { prevRot?.(d); if (fturning(W) && T.ftapIdle) { T.ftapIdle = 0; G.persist?.(); } };
  if (idle >= 3) remind(S);
}
async function remind(S) {
  const G = S.G, W = G.world, T = G.save.tut;
  const stop = () => S.dead || !!S.result || !T.ftapIdle;   // (used it meanwhile: no need)
  // the stage's start: 2 s in, the glass free for a second, no other lesson up and 1.5 s after one (레벨: one guide at a time)
  for (let free = 0; free < 1 && !stop(); ) { if (S.tutEls || !calm(S) || S.t - (S.tStart ?? S.t) < 2 || S.t - (S._tutEnd ?? -9) < 1.5) free = 0; else free += .2; await S.tw.wait(.2); }
  if (stop()) return;
  T.ftapRe = 1; G.persist?.();
  css();
  const { L, cap, keep } = lines(['hold', 'spin']);
  G.ui.tut.append(cap, keep); S.tutEls = [cap, keep];
  try { if (await play(S, 1, L)) await S.tw.wait(.3); }
  finally { cap.remove(); keep.remove(); if (S.tutEls?.[0] === cap) { S.tutEls = null; S._tutEnd = S.t; } }
}
const calm = S => { const W = S.G.world; return !(W.ptrs.size || !S.running || S.paused || S.talking || S.cine || W.flying); };
// the line at the top and the "떼지 마!" tag; only = the lines this one shows (others leave the top empty)
function lines(only = null) {
  const cap = h('div', { class: 'tip ftcap', style: `left:50%;top:${innerHeight * .2}px` }), keep = h('div', { class: 'ftkeep' }, tr(FTAP_CAP.keep));
  let said = null;
  const L = {
    say: k => { if (k === said) return; said = k; const on = !only || only.includes(k); cap.style.visibility = on ? '' : 'hidden'; if (!on) return; cap.textContent = tr(FTAP_CAP[k]); cap.classList.remove('ftnew'); void cap.offsetWidth; cap.classList.add('ftnew'); },
    keepAt: (x, y) => { keep.style.transform = `translate(${x.toFixed(1)}px, ${(y - 52).toFixed(1)}px)`; keep.classList.add('on'); },
    keepOff: () => keep.classList.remove('on'),
  };
  if (only) cap.style.visibility = 'hidden';
  return { L, cap, keep };
}

// the step lines (문구: 스토리 룸 10/20 — the game's own 반말; "됐다!" only when you did it yourself, not in the play)
export const FTAP_CAP = {
  drag: K('한 손가락으로 화면을 드래그해 봐. 방이 움직여', 'Drag with one finger. The room moves'),
  hold: K('그 손가락은 그대로 꾹! 다른 손가락으로 한 번 터치', 'Keep that finger down! Tap once with another finger'),
  spin: K('이제 드래그하면 방이 빙글 돌아', 'Now dragging spins the room'),
  spinYou: K('됐다! 이제 드래그하면 방이 빙글 돌아', 'Got it! Now dragging spins the room'),
  back: K('손을 떼면 다시 이동으로 바뀌어', "Let go, and you're back to moving"),
  keep: K('떼지 마!', 'Keep holding!'),
};

// the lesson: it starts once the glass has been free for a second (and 1.5 s after the lesson before — 레벨 10/20, S._tutEnd);
// two plays when nobody's touching, and in between and after, the line follows your own fingers. It ends when you've done
// it, after 8 s with no finger once both plays are shown, or after 30 s (the stage's own lessons wait meanwhile)
const got = S => { S.G.ui.toast(tr(FTAP_TXT.got), 'green'); S.G.audio.sfx('special'); };
async function demo(S, st) {
  const G = S.G, W = G.world;
  const over = () => S.dead || !!S.result || (!!G.save.tut?.ftap && !st.got);
  for (let free = 0; free < 1 && !over() && !st.got; ) { if (S.tutEls || !calm(S) || S.t - (S._tutEnd ?? -9) < 1.5) free = 0; else free += .2; await S.tw.wait(.2); }
  if (over() || st.got) return;   // (done alone meanwhile: its own toast is on its way)
  css();
  const T = G.save.tut || (G.save.tut = {}); T.ftapN = (T.ftapN || 0) + 1; G.persist?.();
  const { L, cap, keep } = lines();
  G.ui.tut.append(cap, keep); S.tutEls = [cap, keep]; st.live = true;
  const t0 = S.t;
  let plays = 0, free = 0, quiet = 0, turned = false, backT = -9;
  try {
    while (!over() && S.t - t0 < 30) {
      if (!st.got && plays < 2 && free >= 1.2) { if (await play(S, plays % 2 ? -1 : 1, L)) { plays++; backT = S.t; } free = 0; quiet = 0; continue; }
      const n = W.ptrs.size, dt = .05;
      if (n) {
        // your own fingers: the first one down — keep it there; the turn took — now it spins
        free = 0; quiet = 0;
        const f = [...W.ptrs.values()][0], spin = W.eMode === 'turn' && W.eBase !== 'turn';
        L.say(spin ? 'spinYou' : 'hold'); L.keepAt(f.x, f.y); turned = spin;
      } else {
        L.keepOff();
        if (turned) { turned = false; backT = S.t; }
        L.say(S.t - backT < 2 ? 'back' : 'drag');
        if (st.got && S.t - backT >= 1.6) break;   // done it, let go, read ④: then "새로 얻었다!"
        if (calm(S)) free += dt; quiet += dt;
        if (plays >= 2 && quiet > 8) break;   // nobody tried: it comes back on a later stage
      }
      await S.tw.wait(dt);
    }
  } finally {
    cap.remove(); keep.remove(); st.live = false; if (S.tutEls?.[0] === cap) { S.tutEls = null; S._tutEnd = S.t; }
    if (st.got && !S.dead) got(S);
  }
}

// one play, dir 1 → the drag goes right (−1: the mirror, undoing the first); false when a finger (or the stage) cut it short
async function play(S, dir, L) {
  const G = S.G, W = G.world, tw = S.tw;
  css();
  const cut = () => W.ptrs.size > 0 || S.dead || !!S.result || S.paused;   // (not on tut.ftap: the 한 번 더 play is for those who learned it)
  // a step of the play: fn(k) each frame for dur seconds, or false the moment it's cut (the tween is dropped)
  const TAG = 'ftapdemo';
  const step = (dur, fn) => new Promise(res => { let end = false; tw.run(dur, k => { if (end) return; if (cut()) { end = true; tw.kill(TAG); res(false); return; } fn(k); if (k >= 1) { end = true; res(true); } }, k => k, 0, TAG); });
  const io = k => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
  const Wd = W.W, Ht = W.H;
  const x0 = Wd * (dir > 0 ? .26 : .74), y0 = Ht * .6, x1 = x0 + dir * Wd * .12, x2 = x1 + dir * Wd * .22;
  const bx = Wd * (dir > 0 ? .72 : .28), by = Ht * .4;
  // the drag hand on the side it comes from, the touch hand mirrored on the other
  const A = h('div', { class: 'ghand' + (dir > 0 ? '' : ' mir'), html: ICON.hand }), B = h('div', { class: 'ghand' + (dir > 0 ? ' mir' : ''), html: ICON.hand });
  const dA = h('div', { class: 'gdot' }), dB = h('div', { class: 'gdot' }), trail = h('div', { class: 'gtrail' }), piv = h('div', { class: 'turnpiv', html: PIV });
  const els = [trail, dA, dB, piv, A, B];
  const at = (el, x, y) => { el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; };
  const trailTo = x => { const l = Math.min(x0, x), w = Math.abs(x - x0); trail.style.left = l + 'px'; trail.style.top = y0 + 'px'; trail.style.width = w + 'px'; trail.classList.toggle('rev', dir < 0); };
  G.ui.tut.append(...els);   // (S.tutEls is the lesson's, all through: the side buttons step aside — 레벨 세션's stage.js rule for every lesson)
  try {
    // the first finger comes down
    at(A, x0, y0); at(dA, x0, y0); A.classList.add('on'); L.say('drag'); L.keepOff();
    if (!await step(.3, () => {})) return false;
    A.classList.add('down'); dA.classList.add('on');
    if (!await step(.2, () => {})) return false;
    // drag: the room slides with it (the drag's own gain)
    const g = 1.08 * Math.min(1.9, Math.pow(Math.max(1, W.zoom), .35));
    let px = x0;
    if (!await step(1.0, k => { const x = x0 + (x1 - x0) * io(k); W.panBy((x - px) * g, 0); px = x; at(A, x, y0); at(dA, x, y0); trailTo(x); })) return false;
    // the first finger stays down ("떼지 마세요" over it) while the second finger comes: a ring, the gear sound, the '+'
    L.say('hold'); L.keepAt(x1, y0);
    if (!await step(.9, () => {})) return false;
    at(B, bx, by); at(dB, bx, by); B.classList.add('on');
    if (!await step(.35, () => {})) return false;
    B.classList.add('down'); dB.classList.add('on', 'pop'); W.switchFx?.('turn');   // (the ring is the dot's own — .gdot.pop::after)
    const P = W._turnPivot();
    const pin = () => { W.updateCam(); const s = W.toScreen(P); at(piv, s.x, s.y); };
    pin(); piv.classList.add('on');
    if (!await step(.18, () => {})) return false;
    B.classList.remove('down'); dB.classList.remove('on');
    if (!await step(.25, () => {})) return false;
    B.classList.remove('on');
    // the same finger keeps going the same way: now the room spins round the '+' (the drag's own turn rate)
    const kt = 3.6 / Math.max(Wd, 360);
    trail.classList.add('turn'); L.say('spin');
    if (!await step(1.3, k => { const x = x1 + (x2 - x1) * io(k); W.turnAround(P, -(x - px) * kt, 0); px = x; at(A, x, y0); at(dA, x, y0); trailTo(x); L.keepAt(x, y0); pin(); })) return false;
    // and lifts: back to moving
    if (!await step(.35, pin)) return false;
    A.classList.remove('down'); dA.classList.remove('on'); L.keepOff(); L.say('back'); W.switchFx?.('move');
    if (!await step(.3, () => {})) return false;
    A.classList.remove('on'); piv.classList.remove('on'); trail.classList.add('off');
    await step(.9, () => {});
    return true;
  } finally {
    els.forEach(e => e.remove()); L.keepOff();
  }
}

let done = false;
function css() {
  if (done) return; done = true;
  // the hands: the lessons' own hand, see-through with a white glow; the fingertip (40.5, 10.5 of 96 — 55.5 mirrored) on the point
  document.head.append(h('style', {}, `
.ghand { position: absolute; left: 0; top: 0; width: 96px; height: 96px; margin: -10.5px 0 0 -40.5px; z-index: 30; pointer-events: none; opacity: 0; transition: opacity .2s ease-out; filter: drop-shadow(0 0 5px rgba(255, 255, 255, .95)) drop-shadow(0 3px 0 rgba(58, 36, 83, .25)); will-change: transform, opacity; }
.ghand.mir { margin-left: -55.5px; }
.ghand svg { display: block; width: 100%; height: 100%; transform-origin: 42% 11%; transition: transform .12s ease-out; }
.ghand.mir svg { transform: scaleX(-1); transform-origin: 58% 11%; }
.ghand.on { opacity: .8; }
.ghand.down svg { transform: scale(.88); }
.ghand.mir.down svg { transform: scaleX(-1) scale(.88); }
.gdot { position: absolute; left: 0; top: 0; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%; background: rgba(255, 255, 255, .5); box-shadow: 0 0 0 3px rgba(255, 225, 77, .85); z-index: 29; pointer-events: none; opacity: 0; transition: opacity .12s; }
.gdot.on { opacity: 1; }
.gdot.pop { animation: gdotpop .3s ease-out; }
@keyframes gdotpop { 0% { scale: .5; } 60% { scale: 1.15; } 100% { scale: 1; } }
.gdot.pop::after { content: ''; position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 0 3.5px #ffd23f; animation: gdotring .4s ease-out forwards; }   /* (UI 10/20: one yellow ring out of the touch — "여기서 터치" without a word) */
@keyframes gdotring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
.gtrail { position: absolute; height: 16px; margin-top: -8px; border-radius: 8px; z-index: 28; pointer-events: none; background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, .7)); box-shadow: 0 0 0 1.5px rgba(58, 36, 83, .35); transition: opacity .3s; }   /* (UI 10/20: 16px + an ink edge, or it sinks into the wood floor) */
.gtrail.rev { background: linear-gradient(270deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, .6)); }
.gtrail.turn { box-shadow: 0 0 0 1.5px rgba(58, 36, 83, .35), 0 0 0 4px rgba(255, 225, 77, .55); }
.gtrail.off { opacity: 0; }
.ftcap.ftnew { animation: ftcapin .25s ease-out; }
@keyframes ftcapin { 0% { opacity: .2; scale: .94; } 100% { opacity: 1; scale: 1; } }
.ftkeep { position: absolute; left: 0; top: 0; z-index: 31; pointer-events: none; translate: -50% -100%; padding: 3px 11px; border-radius: 12px; background: #fff; color: #3b2a55; border: 2.5px solid #3b2a55; font-size: 15px; white-space: nowrap; opacity: 0; transition: opacity .15s; }
.ftkeep::after { content: ''; position: absolute; left: 50%; bottom: -9px; margin-left: -7px; border: 7px solid transparent; border-top-color: #3b2a55; border-bottom: 0; }
.ftkeep.on { opacity: 1; }
`));
}

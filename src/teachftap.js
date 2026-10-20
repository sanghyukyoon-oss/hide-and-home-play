// 드래그 중 터치 회전 수업. 세 번째 판 (10/20 밤, user on the phone: "이동 중 터치 튜토 너무 지저분하다.. 깔끔하게 다시 정리해 줄래?
// 떼지 마는 괜찮은데 뭔가 지저분하고 이해도 안 돼서 작가랑 상의해서 최선으로"). One thing at a time: a see-through hand drags
// (the room slides) → it stops and "떼지 마!" sits over it → a second hand touches once (one ring) → the first drags on and
// the room spins. One play. One card at the top that never changes — why, then how (스토리 룸) — which steps away while the
// room spins. After the play the card stays while you try, the tag over your own first finger; done → "새로 얻었다!" once you
// let go. (Before: two plays, a trail, dots, a '+', four step lines and "됐다!" — "지저분".) Doing it alone counts the same.
// When: from 2판, after you've moved the view a little (150 px of dragging, 3 s in), or sooner when it's needed (nothing left
// to find shows from here and nothing found for 8 s) — and only while no finger is on the glass: a touch stops the play.
// On up to three stages until you've done it. Not in timed, boss, custom or model-kit stages (S.model, S.kit).
// ?ftapteach=0 → off.
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';
import { h, ICON } from './ui.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
export const FTAP_ON = typeof location === 'undefined' || !/[?&]ftapteach=0(&|$)/.test(location.search);
export const FTAP_TXT = {
  got: K('새로 얻었다! 방 빙글 돌리기', 'New move: spin the room!'),   // (문구: 스토리 룸 10/20)
};

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
// twist doesn't count, it's this move we remind of. Three stages in a row unused → at the start of the next one, the same
// one play with its card (no trying after). Once; never again after that.
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
  const { L, cap, keep } = lines();
  G.ui.tut.append(cap, keep); S.tutEls = [cap, keep];
  try { if (await play(S, L)) await S.tw.wait(.3); }
  finally { cap.remove(); keep.remove(); if (S.tutEls?.[0] === cap) { S.tutEls = null; S._tutEnd = S.t; } }
}
const calm = S => { const W = S.G.world; return !(W.ptrs.size || !S.running || S.paused || S.talking || S.cine || W.flying); };
// the two-line card at the top (why, then how — fixed for the whole lesson) and the "떼지 마!" tag over the first finger
function lines() {
  const cap = h('div', { class: 'tip ftcap', style: `left:50%;top:${innerHeight * .2}px` }, h('b', {}, tr(FTAP_CAP.why)), h('span', {}, tr(FTAP_CAP.how)));
  const keep = h('div', { class: 'ftkeep' }, tr(FTAP_CAP.keep));
  const L = {
    cap: on => cap.classList.toggle('off', !on),   // (the room spinning is the answer: the card steps away meanwhile)
    keepAt: (x, y) => { keep.style.transform = `translate(${x.toFixed(1)}px, ${(y - 52).toFixed(1)}px)`; keep.classList.add('on'); },
    keepOff: () => keep.classList.remove('on'),
  };
  return { L, cap, keep };
}

// the words (스토리 룸 10/20 밤, user: "이동 중 터치 튜토 너무 지저분하다.. 깔끔하게 다시 정리해 줄래? 떼지 마는 괜찮은데"): one card,
// two lines that never change — why, then how — and the "떼지 마!" tag; no step lines, no "됐다!", only the toast after the lift
export const FTAP_CAP = {
  why: K('방을 돌려 뒤쪽을 보자', 'Turn the room to see behind'),
  how: K('드래그한 채로, 다른 손가락으로 터치', 'Keep dragging, tap with another finger'),
  keep: K('떼지 마!', 'Keep holding!'),
};

// the lesson: it starts once the glass has been free for a second (and 1.5 s after the lesson before — 레벨 10/20, S._tutEnd);
// one play, then the card stays while you try: a finger down → "떼지 마!" over it; the room turning → the card steps away. It
// ends when you've done it (the toast after you let go), after 8 s with no finger, or after 30 s (the stage's own lessons wait)
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
  let played = false, free = 0, quiet = 0;
  try {
    while (!over() && S.t - t0 < 30) {
      if (!st.got && !played && free >= .4) { played = await play(S, L); free = 0; quiet = 0; continue; }
      const dt = .05;
      if (W.ptrs.size) {
        free = 0; quiet = 0;
        const f = [...W.ptrs.values()][0];
        L.keepAt(f.x, f.y); L.cap(!(W.eMode === 'turn' && W.eBase !== 'turn'));
      } else {
        L.keepOff(); L.cap(true);
        if (st.got) break;   // done it and let go: "새로 얻었다!"
        if (calm(S)) free += dt; quiet += dt;
        if (played && quiet > 8) break;   // nobody tried: it comes back on a later stage
      }
      await S.tw.wait(dt);
    }
  } finally {
    cap.remove(); keep.remove(); st.live = false; if (S.tutEls?.[0] === cap) { S.tutEls = null; S._tutEnd = S.t; }
    if (st.got && !S.dead) got(S);
  }
}

// one play, one thing at a time: a hand drags (the room slides) → it stops, "떼지 마!" over it → a second hand touches once
// (one ring) and goes → the first hand drags on and the room spins (the card steps away) → it lifts. No trail, no dots, no
// '+'. False when a finger (or the stage) cut it short
async function play(S, L) {
  const G = S.G, W = G.world, tw = S.tw;
  css();
  const cut = () => W.ptrs.size > 0 || S.dead || !!S.result || S.paused;   // (not on tut.ftap: the 한 번 더 play is for those who learned it)
  // a step of the play: fn(k) each frame for dur seconds, or false the moment it's cut (the tween is dropped)
  const TAG = 'ftapdemo';
  const step = (dur, fn = () => {}) => new Promise(res => { let end = false; tw.run(dur, k => { if (end) return; if (cut()) { end = true; tw.kill(TAG); res(false); return; } fn(k); if (k >= 1) { end = true; res(true); } }, k => k, 0, TAG); });
  const io = k => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
  const Wd = W.W, Ht = W.H;
  const x0 = Wd * .26, y0 = Ht * .6, x1 = x0 + Wd * .12, x2 = x1 + Wd * .22, bx = Wd * .72, by = Ht * .42;
  const A = h('div', { class: 'ghand', html: ICON.hand }), B = h('div', { class: 'ghand mir', html: ICON.hand }), ring = h('div', { class: 'gring' });
  const els = [ring, A, B];
  const at = (el, x, y) => { el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; };
  G.ui.tut.append(...els);   // (S.tutEls is the lesson's, all through: the side buttons step aside — 레벨 세션's stage.js rule for every lesson)
  try {
    // ① a hand comes down and drags: the room slides with it (the drag's own gain)
    at(A, x0, y0); A.classList.add('on'); L.cap(true); L.keepOff();
    if (!await step(.35)) return false;
    A.classList.add('down');
    const g = 1.08 * Math.min(1.9, Math.pow(Math.max(1, W.zoom), .35));
    let px = x0;
    if (!await step(1.0, k => { const x = x0 + (x1 - x0) * io(k); W.panBy((x - px) * g, 0); px = x; at(A, x, y0); })) return false;
    // ② it stays down: "떼지 마!"
    L.keepAt(x1, y0);
    if (!await step(.8)) return false;
    // ③ a second hand touches once — one ring — and goes
    at(B, bx, by); at(ring, bx, by); B.classList.add('on');
    if (!await step(.35)) return false;
    B.classList.add('down'); ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go'); W.switchFx?.('turn');
    if (!await step(.2)) return false;
    B.classList.remove('down', 'on');
    if (!await step(.3)) return false;
    // ④ the first hand drags on: the room spins (round the middle of the view — the move's own pivot); the card steps away
    const P = W._turnPivot(), kt = 3.6 / Math.max(Wd, 360);
    L.cap(false);
    if (!await step(1.3, k => { const x = x1 + (x2 - x1) * io(k); W.turnAround(P, -(x - px) * kt, 0); px = x; at(A, x, y0); L.keepAt(x, y0); })) return false;
    if (!await step(.3)) return false;
    // and lifts
    A.classList.remove('down'); L.keepOff(); W.switchFx?.('move');
    if (!await step(.25)) return false;
    A.classList.remove('on'); L.cap(true);
    await step(.4);
    return true;
  } finally {
    els.forEach(e => e.remove()); L.keepOff(); L.cap(true);
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
.ghand.on { opacity: .85; }
.ghand.down svg { transform: scale(.88); }
.ghand.mir.down svg { transform: scaleX(-1) scale(.88); }
.gring { position: absolute; left: 0; top: 0; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%; box-shadow: 0 0 0 3.5px #ffd23f; z-index: 29; pointer-events: none; opacity: 0; }
.gring.go { animation: gringgo .45s ease-out; }
@keyframes gringgo { 0% { transform: scale(.6); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
.ftcap { display: flex; flex-direction: column; gap: 2px; transition: opacity .2s; }
.ftcap b { font-weight: normal; font-size: .82em; opacity: .75; }
.ftcap.off { opacity: 0; }
.ftkeep { position: absolute; left: 0; top: 0; z-index: 31; pointer-events: none; translate: -50% -100%; padding: 3px 11px; border-radius: 12px; background: #fff; color: #3b2a55; border: 2.5px solid #3b2a55; font-size: 15px; white-space: nowrap; opacity: 0; transition: opacity .15s; }
.ftkeep::after { content: ''; position: absolute; left: 50%; bottom: -9px; margin-left: -7px; border: 7px solid transparent; border-top-color: #3b2a55; border-bottom: 0; }
.ftkeep.on { opacity: 1; }
`));
}

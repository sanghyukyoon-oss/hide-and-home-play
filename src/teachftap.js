// 드래그 중 터치 회전 수업. 네 번째 판 (10/20 밤, user on the phone: "그냥 2판 시작하면서, 이동 중에 잠시 회전할 수 있어요. 이동하면서
// 터치하면 회전으로 잠시 변해요. 떼면 다시 이동. 이걸 말로 잘 설명하는 법 없을까? 적응되면 이게 제일 편함"). At the start of 2판
// a see-through hand plays it in three beats, one short line each (스토리 룸) — the mode word coloured, so "이동 → 회전 → 이동"
// reads without reading the rest:
//   ① "드래그하면 이동"          the hand drags, the room slides
//   ② "드래그한 채 터치! 손 뗄 때까지 회전" it keeps holding ("떼지 마!" over it), a second hand touches once, the drag now spins the room
//   ③ "손 떼면 다시 이동"        it lifts, comes down again and drags: the room slides again
// Then your turn: the line follows your own fingers (nothing down ①, a finger down ② and "떼지 마!", you let go after a turn
// ③); done → after ③ the game's '새로 얻었다!' badge (빙글 돌리기 · 드래그 중 터치). Doing it alone counts the same.
// (Before: a two-line card, "지저분 · 장황" — and earlier still trails, dots, a '+', two plays.)
// When: the start of the stage (2판 first; on up to three stages until you've done it), once the opening is over and the glass
// has been free a second, and no other lesson is up — the stage's own lessons wait for it (레벨: one guide at a time). Not in
// timed, boss, custom or model-kit stages (S.model, S.kit). ?ftapteach=0 → off.
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';
import { h, ICON } from './ui.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
export const FTAP_ON = typeof location === 'undefined' || !/[?&]ftapteach=0(&|$)/.test(location.search);
// the words (스토리 룸 10/20 밤): three beats, the tag, and the badge
export const FTAP_CAP = {
  move: K('드래그하면 이동', 'Drag to move'),
  spin: K('드래그한 채 터치! 손 뗄 때까지 회전', 'Tap while dragging: spin until you let go'),   // (user 10/20: "드래그하던 손을 떼기 전까지 회전으로 바뀌어요라는 의미가 있었으면")
  back: K('손 떼면 다시 이동', 'Let go: back to moving'),
  keep: K('떼지 마!', 'Keep holding!'),
};
export const FTAP_CARD = { top: K('새로 얻었다!', 'New move!'), big: K('빙글 돌리기', 'Spin'), small: K('드래그 중 터치', 'Drag + tap') };
// the mode word in each line, coloured: 이동 sky blue, 회전 pink (스토리 룸: "잠깐 바뀌었다 돌아온다"가 글을 다 안 읽어도 보이게)
const MODE = [['회전', 'spin'], ['spin', 'spin'], ['이동', 'move'], ['moving', 'move'], ['move', 'move']];

// a drag that a second-finger touch turned into a turn (not the dial, not the 회전 badge of the E controls)
const fturning = W => W.eMode === 'turn' && W.eBase !== 'turn' && W.ptrs.size > 0 && !W._tdHeld;
const calm = S => { const W = S.G.world; return !(W.ptrs.size || !S.running || S.paused || S.talking || S.cine || W.flying); };

export function armFtap(S) {
  const G = S.G, W = G.world;
  if (!FTAP_ON || W.scheme !== 'F' || S.idx < 1 || S.custom || S.model || S.kit || S.preview || S.spec.timed || S.spec.boss || S.botOn?.()) return;
  if (G.save.tut?.ftap) return refresh(S);
  if ((G.save.tut?.ftapN || 0) >= 3) return;
  const st = { turned: 0 };
  const prevRot = W.onRotate;
  // done it: a real drag-then-touch turn of ~20°; the badge waits for the lift (and, in the lesson, for ③)
  W.onRotate = d => { prevRot?.(d); if (!fturning(W) || G.save.tut?.ftap) return; st.turned += Math.abs(d) || 0;
    if (st.turned < .35) return;
    const T = G.save.tut || (G.save.tut = {}); T.ftap = 1; T.ftapIdle = 0; G.persist?.(); st.got = true;
    if (!st.live) (async () => { while (W.ptrs.size && !S.dead) await S.tw.wait(.1); if (!S.dead) got(S); })(); };
  lesson(S, st);
}

// 한 번 더 (10/20 밤, user: "뒤쪽 가서도 이동 중 터치해서 잠시 회전 안 쓰면 튜토 한 번 더 내보낼 수 있어?"): once learned, every
// stage (the same stages as the lesson) counts as unused until a drag-then-touch turn happens in it — the dial or a two-finger
// twist doesn't count, it's this move we remind of. Three stages in a row unused → at the start of the next one, the same
// three-beat play (no trying after). Once; never again after that.
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
  const G = S.G, T = G.save.tut;
  const stop = () => S.dead || !!S.result || !T.ftapIdle;   // (used it meanwhile: no need)
  if (!await waitStart(S, stop)) return;
  T.ftapRe = 1; G.persist?.();
  const L = lines(S); S.tutEls = L.els;
  try { if (await play(S, L)) await S.tw.wait(.6); }
  finally { L.remove(); if (S.tutEls === L.els) { S.tutEls = null; S._tutEnd = S.t; } }
}
// the stage's start: the opening done, 1 s in, the glass free for a second, no other lesson up and 1.5 s after one
async function waitStart(S, stop) {
  for (let free = 0; free < 1; ) {
    if (stop()) return false;
    if (S.tutEls || !calm(S) || S.t - (S.tStart ?? S.t) < 1 || S.t - (S._tutEnd ?? -9) < 1.5) free = 0; else free += .2;
    await S.tw.wait(.2);
  }
  return !stop();
}

// the line at the top (its mode word coloured) and the "떼지 마!" tag over the first finger
function lines(S) {
  css();
  const cap = h('div', { class: 'tip ftcap', style: `left:50%;top:${innerHeight * .2}px` }), keep = h('div', { class: 'ftkeep' }, tr(FTAP_CAP.keep), h('i', { class: 'ftspin' }, '↻'));
  let said = null;
  const L = {
    els: [cap, keep],
    say: k => {
      if (k === said) return; said = k;
      const s = tr(FTAP_CAP[k]), m = MODE.find(([w]) => s.includes(w)), i = m ? s.indexOf(m[0]) : -1;
      cap.replaceChildren(...(i < 0 ? [s] : [s.slice(0, i), h('b', { class: 'ftm ' + m[1] }, m[0]), s.slice(i + m[0].length)]));
      cap.classList.remove('ftnew'); void cap.offsetWidth; cap.classList.add('ftnew');
    },
    keepAt: (x, y) => { keep.style.transform = `translate(${x.toFixed(1)}px, ${(y - 52).toFixed(1)}px)`; keep.classList.add('on'); },
    keepOff: () => keep.classList.remove('on', 'turning'),
    // (user 10/20, via 인수인계: a small ↻ turning beside "떼지 마!" while the turn lasts — '뗄 때까지' seen, not read)
    turning: on => keep.classList.toggle('turning', !!on),
    remove: () => { cap.remove(); keep.remove(); },
  };
  S.G.ui.tut.append(cap, keep);
  return L;
}

// the game's own '새로 얻었다!' badge (script.js newCard's look — ncard-mini): what you got, big; how, small
const got = S => {
  const c = h('div', { class: 'ncard-mini' }, h('b', {}, tr(FTAP_CARD.top)), h('span', { class: 'ol' }, tr(FTAP_CARD.big)), h('small', {}, tr(FTAP_CARD.small)));
  document.getElementById('overlay')?.append(c); S.G.audio.sfx('special');
  setTimeout(() => c.classList.add('out'), 2600); setTimeout(() => c.remove(), 3100);
};

// the lesson: the three-beat play at the start, then your turn — the line follows your fingers. It ends once you've done it
// (③, then the badge), after 8 s with no finger, or after 30 s (the stage's own lessons wait meanwhile)
async function lesson(S, st) {
  const G = S.G, W = G.world;
  const over = () => S.dead || !!S.result || (!!G.save.tut?.ftap && !st.got);
  if (!await waitStart(S, () => over() || st.got)) return;
  const T = G.save.tut || (G.save.tut = {}); T.ftapN = (T.ftapN || 0) + 1; G.persist?.();
  const L = lines(S); S.tutEls = L.els; st.live = true;
  const t0 = S.t;
  let played = false, quiet = 0, free = 0, turned = false, backT = -9;
  try {
    while (!over() && S.t - t0 < 30) {
      if (!st.got && !played && free >= .3) { played = await play(S, L); free = 0; quiet = 0; continue; }
      const dt = .05;
      if (W.ptrs.size) {
        free = 0; quiet = 0;
        const f = [...W.ptrs.values()][0];
        const spin = W.eMode === 'turn' && W.eBase !== 'turn';
        L.say('spin'); L.keepAt(f.x, f.y); L.turning(spin); if (spin) turned = true;
      } else {
        L.keepOff();
        if (turned) { turned = false; backT = S.t; }
        L.say(S.t - backT < 1.6 ? 'back' : 'move');
        if (st.got && S.t - backT >= 1.2) break;   // done it, let go, ③ read: then the badge
        if (calm(S)) free += dt; quiet += dt;
        if (played && quiet > 8) break;   // nobody tried: it comes back on a later stage
      }
      await S.tw.wait(dt);
    }
  } finally {
    L.remove(); st.live = false; if (S.tutEls === L.els) { S.tutEls = null; S._tutEnd = S.t; }
    if (st.got && !S.dead) got(S);
  }
}

// the play, three beats. A hand drags (① the room slides) → holds, "떼지 마!" over it, a second hand touches once (one ring)
// and the drag now spins the room (②) → it lifts, comes down again and drags: the room slides (③). No trail, no dots, no '+'.
// False when a finger (or the stage) cut it short
async function play(S, L) {
  const G = S.G, W = G.world, tw = S.tw;
  const cut = () => W.ptrs.size > 0 || S.dead || !!S.result || S.paused;   // (not on tut.ftap: the 한 번 더 play is for those who learned it)
  const TAG = 'ftapdemo';
  const step = (dur, fn = () => {}) => new Promise(res => { let end = false; tw.run(dur, k => { if (end) return; if (cut()) { end = true; tw.kill(TAG); res(false); return; } fn(k); if (k >= 1) { end = true; res(true); } }, k => k, 0, TAG); });
  const io = k => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
  const Wd = W.W, Ht = W.H, g = 1.08 * Math.min(1.9, Math.pow(Math.max(1, W.zoom), .35)), kt = 3.6 / Math.max(Wd, 360);
  const x0 = Wd * .24, y0 = Ht * .6, x1 = x0 + Wd * .12, x2 = x1 + Wd * .2, x3 = x2 - Wd * .14, bx = Wd * .72, by = Ht * .42;
  const A = h('div', { class: 'ghand', html: ICON.hand }), B = h('div', { class: 'ghand mir', html: ICON.hand }), ring = h('div', { class: 'gring' });
  const els = [ring, A, B];
  const at = (el, x, y) => { el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; };
  G.ui.tut.append(...els);
  let px;
  const drag = (from, to, dur, spin = null) => { px = from; return step(dur, k => { const x = from + (to - from) * io(k); if (spin) W.turnAround(spin, -(x - px) * kt, 0); else W.panBy((x - px) * g, 0); px = x; at(A, x, y0); if (spin) L.keepAt(x, y0); }); };
  try {
    // ① 드래그하면 이동
    L.say('move'); L.keepOff(); at(A, x0, y0); A.classList.add('on');
    if (!await step(.35)) return false;
    A.classList.add('down');
    if (!await drag(x0, x1, 1.0)) return false;
    // ② 드래그한 채 터치! 손 뗄 때까지 회전 — it holds ("떼지 마!"), the second hand touches once, the same drag now spins
    L.say('spin'); L.keepAt(x1, y0);
    if (!await step(.7)) return false;
    at(B, bx, by); at(ring, bx, by); B.classList.add('on');
    if (!await step(.3)) return false;
    B.classList.add('down'); ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go'); W.switchFx?.('turn');
    if (!await step(.2)) return false;
    B.classList.remove('down', 'on');
    if (!await step(.25)) return false;
    L.turning(true);
    if (!await drag(x1, x2, 1.3, W._turnPivot())) return false;
    // ③ 손 떼면 다시 이동 — it lifts, comes down again and drags: the room slides again
    if (!await step(.25)) return false;
    A.classList.remove('down'); L.keepOff(); L.say('back'); W.switchFx?.('move');
    if (!await step(.55)) return false;
    A.classList.add('down');
    if (!await drag(x2, x3, .9)) return false;
    A.classList.remove('down');
    if (!await step(.25)) return false;
    A.classList.remove('on');
    await step(.6);
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
.ghand.on { opacity: .85; }
.ghand.down svg { transform: scale(.88); }
.ghand.mir.down svg { transform: scaleX(-1) scale(.88); }
.gring { position: absolute; left: 0; top: 0; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%; box-shadow: 0 0 0 3.5px #ffd23f; z-index: 29; pointer-events: none; opacity: 0; }
.gring.go { animation: gringgo .45s ease-out; }
@keyframes gringgo { 0% { transform: scale(.6); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
.ftcap.ftnew { animation: ftcapin .25s ease-out; }
@keyframes ftcapin { 0% { opacity: .2; scale: .94; } 100% { opacity: 1; scale: 1; } }
.ftcap .ftm { font-weight: normal; padding: 0 5px; border-radius: 8px; color: #fff; }
.ftcap .ftm.move { background: #4dabf7; }
.ftcap .ftm.spin { background: #ff6f91; }
.ftkeep { position: absolute; left: 0; top: 0; z-index: 31; pointer-events: none; translate: -50% -100%; padding: 3px 11px; border-radius: 12px; background: #fff; color: #3b2a55; border: 2.5px solid #3b2a55; font-size: 15px; white-space: nowrap; opacity: 0; transition: opacity .15s; }
.ftkeep::after { content: ''; position: absolute; left: 50%; bottom: -9px; margin-left: -7px; border: 7px solid transparent; border-top-color: #3b2a55; border-bottom: 0; }
.ftkeep.on { opacity: 1; }
.ftkeep .ftspin { position: absolute; right: -30px; top: 50%; margin-top: -13px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #ff6f91; color: #fff; font-style: normal; font-size: 18px; line-height: 1; border: 2px solid #3b2a55; opacity: 0; transition: opacity .15s; }
.ftkeep.turning .ftspin { opacity: 1; animation: ftspin .9s linear infinite; }
@keyframes ftspin { to { rotate: 360deg; } }
`));
}

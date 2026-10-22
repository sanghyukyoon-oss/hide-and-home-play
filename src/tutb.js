// 튜토리얼 B (③ 10/22, user: "지금 좀 과한 거 아닌가", "토순이집 들어가면 그냥 '이동 중에 터치를 하면 회전으로 잠시 바뀌어요' 이런 안내
// 하나면"): a lighter start, to try side by side with the lessons we have (A). ?tut=b or 더보기 → 튜토리얼 B (this device); A stays
// the default.
//  1판: no lesson cards, no hand — you just play. Only if nothing is touched for 7 s does a see-through hand drag across once.
//       (the toy box is still the thing to turn to; nobody says so)
//  2판: one line for 2.5 s — how to turn while moving. If you haven't turned in 20 s, the hand shows it once (no three steps).
//       Turning at all ends it, quietly.
//  Gone in B: the three-beat drag + touch lesson and its '새로 얻었다' badge, the tilt and double-tap lessons, the controls
//  summary on 2판's result (still in 더보기 → 조작 도움말).
import { h, ICON } from './ui.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const TUT_B = (() => { const q = QS.get('tut'); if (q === 'b' || q === 'a') { try { localStorage.setItem('sbk-tut', q); } catch {} return q === 'b'; } try { return localStorage.getItem('sbk-tut') === 'b'; } catch { return false; } })();
export function setTutB(on) { try { localStorage.setItem('sbk-tut', on ? 'b' : 'a'); } catch {} }
export const TUTB_TXT = {
  turn: K('이동하면서 다른 손가락으로 터치하면 잠깐 회전돼요', 'While dragging, touch with another finger to turn for a moment'),
  on: K('튜토리얼 B 켜기', 'Tutorial B: on'), off: K('튜토리얼 B 끄기', 'Tutorial B: off'),
};

// a see-through hand that drags across once (or a second finger touching while it drags, for the turn)
async function hand(S, kind) {
  const W = S.G.world, el = h('div', { class: 'tutb-hand', html: ICON.hand }), el2 = kind === 'turn' ? h('div', { class: 'tutb-hand two', html: ICON.hand }) : null;
  css();
  const x0 = innerWidth * .38, y0 = innerHeight * .56, dx = innerWidth * .26;
  el.style.left = x0 + 'px'; el.style.top = y0 + 'px'; S.G.ui.tut.append(el); if (el2) { el2.style.left = (x0 + dx * .4) + 'px'; el2.style.top = (y0 - 90) + 'px'; S.G.ui.tut.append(el2); }
  const a = el.animate([{ transform: 'translate(0,0) scale(1.1)', opacity: 0 }, { transform: 'translate(0,0) scale(1)', opacity: .85, offset: .15 }, { transform: `translate(${dx}px,0)`, opacity: .85, offset: .8 }, { transform: `translate(${dx}px,0)`, opacity: 0 }], { duration: 1600, easing: 'ease-in-out' });
  if (el2) el2.animate([{ opacity: 0 }, { opacity: 0, offset: .35 }, { opacity: .85, transform: 'scale(.9)', offset: .45 }, { opacity: .85, offset: .75 }, { opacity: 0 }], { duration: 1600 });
  await a.finished.catch(() => {});
  el.remove(); el2?.remove(); void W;
}
let done = false;
function css() {
  if (done) return; done = true;
  const s = document.createElement('style');
  s.textContent = `.tutb-hand{position:absolute;z-index:31;pointer-events:none;width:84px;height:84px;margin:-8px 0 0 -26px;filter:drop-shadow(0 3px 4px rgba(42,26,61,.35))}
.tutb-hand svg{width:100%;height:100%}
.tutb-hand.two{width:72px;height:72px}
.tutb-line{position:absolute;left:50%;transform:translateX(-50%);z-index:31;pointer-events:none;background:rgba(42,26,61,.78);color:#fff;border-radius:16px;padding:9px 16px;font:600 16px 'Ssurround',sans-serif;max-width:86vw;text-align:center;word-break:keep-all;transition:opacity .4s}`;
  document.head.append(s);
}

// your fingers on the screen (the view moving by itself — the intro, the sway — doesn't count)
function touches(S) {
  const r = { last: performance.now(), moved: false };
  const down = () => { r.last = performance.now(); }, move = e => { if (e.buttons || e.pointerType === 'touch') { r.last = performance.now(); r.moved = true; } };
  addEventListener('pointerdown', down, true); addEventListener('pointermove', move, true);
  r.off = () => { removeEventListener('pointerdown', down, true); removeEventListener('pointermove', move, true); };
  return r;
}
// 1판: just play; 7 s with no finger → the hand drags once
export async function tutB1(S) {
  S.tutStep = 3;
  for (let i = 0; i < 40 && (S.talking || S.cine || S.G.world.flying || !S.running); i++) await S.tw.wait(.25);
  const T = touches(S);
  try {
    for (;;) {
      await S.tw.wait(.5); if (S.dead || S.result || T.moved) return;
      if (performance.now() - T.last > 7000 && !S.paused && !S.talking && !S.cine) { await hand(S, 'move'); return; }
    }
  } finally { T.off(); }
}
// 2판: one line; 20 s with no turn of yours → the hand once; a turn ends it
export async function tutB2(S) {
  const G = S.G, W = G.world;
  css();
  for (let i = 0; i < 40 && (S.talking || S.cine || W.flying || !S.running); i++) await S.tw.wait(.25);
  if (S.dead || S.result) return;
  const line = h('div', { class: 'tutb-line', style: `top:${Math.round(innerHeight * .2)}px` }, tr(TUTB_TXT.turn)); G.ui.tut.append(line);
  setTimeout(() => { line.style.opacity = '0'; setTimeout(() => line.remove(), 450); }, 2600);
  let turn = 0, y = W.yaw; const t0 = S.t;
  while (!S.dead && !S.result) {
    await S.tw.wait(.25);
    if (W.ptrs?.size) turn += Math.abs(W.yaw - y); y = W.yaw;
    if (turn > .3) break;
    if (S.t - t0 > 20) { await hand(S, 'turn'); break; }
  }
}

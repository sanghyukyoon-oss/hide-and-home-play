// 튜토리얼 B (③ 10/22, user: "지금 좀 과한 거 아닌가", "토순이집 들어가면 그냥 '이동 중에 터치를 하면 회전으로 잠시 바뀌어요' 이런 안내
// 하나면"): a lighter start. B is the default since 10/22 (user: "b로 하고 글자 노출 시간 좀 더 늘려"); ?tut=a or 더보기 → 튜토리얼 B 끄기
// brings back the old lessons (A) on this device.
//  1판: as A (user 10/22 "1은 원래 것이 나은 것 같음"; tutB1 below is kept, unused).
//  2판: one line for 5 s — how to turn while moving. If you haven't turned in 20 s, the hand shows it once (no three steps).
//       Turning at all ends it, quietly.
//  Gone in B: the three-beat drag + touch lesson and its '새로 얻었다' badge, the tilt and double-tap lessons, the controls
//  summary on 2판's result (still in 더보기 → 조작 도움말).
import { h, ICON } from './ui.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const TUT_B = (() => { const q = QS.get('tut'); if (q === 'b' || q === 'a') { try { localStorage.setItem('sbk-tut', q); } catch {} return q === 'b'; } try { return localStorage.getItem('sbk-tut') !== 'a'; } catch { return true; } })();
export function setTutB(on) { try { localStorage.setItem('sbk-tut', on ? 'b' : 'a'); } catch {} }
export const TUTB_TXT = {
  turn: K('이동하면서 다른 손가락으로 터치하면 잠깐 회전돼요', 'While dragging, touch with another finger to turn for a moment'),
  on: K('튜토리얼 B 켜기', 'Tutorial B: on'), off: K('튜토리얼 B 끄기', 'Tutorial B: off'),
};

// a see-through hand that drags across once (or a second finger touching while it drags, for the turn)
async function hand(S, kind) {
  // (the game's own lesson hand — .hand, as in teach() — not a look of its own)
  const W = S.G.world, el = h('div', { class: 'hand', html: ICON.hand }), el2 = kind === 'turn' ? h('div', { class: 'hand', html: ICON.hand, style: 'width:80px;height:80px' }) : null;
  const x0 = innerWidth * .38, y0 = innerHeight * .56, dx = innerWidth * .26;
  el.style.left = x0 + 'px'; el.style.top = y0 + 'px'; S.G.ui.tut.append(el); if (el2) { el2.style.left = (x0 + dx * .4) + 'px'; el2.style.top = (y0 - 90) + 'px'; S.G.ui.tut.append(el2); }
  const a = el.animate([{ transform: 'translate(0,0) scale(1.1)', opacity: 0 }, { transform: 'translate(0,0) scale(1)', opacity: .85, offset: .15 }, { transform: `translate(${dx}px,0)`, opacity: .85, offset: .8 }, { transform: `translate(${dx}px,0)`, opacity: 0 }], { duration: 1600, easing: 'ease-in-out' });
  if (el2) el2.animate([{ opacity: 0 }, { opacity: 0, offset: .35 }, { opacity: .85, transform: 'scale(.9)', offset: .45 }, { opacity: .85, offset: .75 }, { opacity: 0 }], { duration: 1600 });
  await a.finished.catch(() => {});
  el.remove(); el2?.remove(); void W;
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
  for (let i = 0; i < 40 && (S.talking || S.cine || W.flying || !S.running); i++) await S.tw.wait(.25);
  if (S.dead || S.result) return;
  // (the game's own lesson card — .tip, as in teach(): ink border, the same font and colours)
  // (이동·회전 in coloured boxes, as the old lessons did — user 10/22 "이동, 회전에 전처럼 네모 색깔 네모로 강조")
  const txt = tr(TUTB_TXT.turn).replace(/이동|dragging/, w => `<span class="tkw mv">${w}</span>`).replace(/회전|turn/, w => `<span class="tkw tn">${w}</span>`);
  const line = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .2}px;transition:opacity .4s`, html: txt }); G.ui.tut.append(line);
  setTimeout(() => { line.style.opacity = '0'; setTimeout(() => line.remove(), 450); }, 5000);
  let turn = 0, y = W.yaw; const t0 = S.t;
  while (!S.dead && !S.result) {
    await S.tw.wait(.25);
    if (W.ptrs?.size) turn += Math.abs(W.yaw - y); y = W.yaw;
    if (turn > .3) break;
    if (S.t - t0 > 20) { await hand(S, 'turn'); break; }
  }
}

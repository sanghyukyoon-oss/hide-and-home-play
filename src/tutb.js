// 튜토리얼 B (③ 10/22, user: "지금 좀 과한 거 아닌가", "토순이집 들어가면 그냥 '이동 중에 터치를 하면 회전으로 잠시 바뀌어요' 이런 안내
// 하나면"): a lighter start. B is the default since 10/22 (user: "b로 하고 글자 노출 시간 좀 더 늘려"); ?tut=a or 더보기 → 튜토리얼 B 끄기
// brings back the old lessons (A) on this device.
//  1판: as A (user 10/22 "1은 원래 것이 나은 것 같음"; tutB1 below is kept, unused), but in the order 이동 → 이동 중 터치 (the
//       three-beat lesson, teachftap ftapLesson1) → 돌림판 (user 10/25). 2판 unused → 3판 the three-beat play once (armFtapB).
//  2판: one line for 5 s — how to turn while moving. If you haven't turned in 20 s, the hand shows it once (no three steps).
//       Turning at all ends it, quietly.
//  Gone in B: the three-beat lesson on 2판 (it is 1판 ② now), the tilt and double-tap lessons, the controls
//  summary on 2판's result (still in 더보기 → 조작 도움말).
import { h, ICON } from './ui.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const TUT_B = (() => { const q = QS.get('tut'); if (q === 'b' || q === 'a') { try { localStorage.setItem('sbk-tut', q); } catch {} return q === 'b'; } try { return localStorage.getItem('sbk-tut') !== 'a'; } catch { return true; } })();
export function setTutB(on) { try { localStorage.setItem('sbk-tut', on ? 'b' : 'a'); } catch {} }
export const TUTB_TXT = {
  turn: K('이동하면서 다른 손가락으로 터치하면 잠깐 회전돼요', 'While dragging, tap with another finger to turn for a moment'),
  keep: K('떼지 마!', 'Keep holding!'), keep2: K('다른 손가락으로 터치!', 'Tap with another finger!'),
  // (1판 ③, after the drag + touch lesson turned the box's front into view already: the dial still gets its line)
  dial: K('돌림판을 드래그해도 회전돼', 'Dragging the dial turns the room too'),
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
  // (user 10/24: "'떼지 마' 튜토리얼에 넣어 달랬는데" — the B lesson had no such tag) while one finger drags, a big "떼지 마!" over it
  // (kept on screen, toward the middle) with "다른 손가락으로 터치!" under it; gone when the turn is done or the finger lifts
  keepCss();
  const tag = h('div', { class: 'tbkeep' }, h('b', {}, tr(TUTB_TXT.keep)), h('span', {}, tr(TUTB_TXT.keep2))); G.ui.tut.append(tag);
  const place = () => {
    const ps = [...(W.ptrs?.values() || [])];
    if (ps.length !== 1 || S.paused || S.talking) { tag.classList.remove('on'); return; }
    const p = ps[0], w = tag.offsetWidth || 220, hgt = tag.offsetHeight || 80;
    const x = Math.max(w / 2 + 10, Math.min(innerWidth - w / 2 - 10, p.x * .6 + innerWidth / 2 * .4)), yy = Math.max(hgt + 70, Math.min(innerHeight - 160, p.y - 70));
    tag.style.left = x + 'px'; tag.style.top = yy + 'px'; tag.classList.add('on');
  };
  const iv = setInterval(place, 50);
  let turn = 0, y = W.yaw; const t0 = S.t;
  try {
    while (!S.dead && !S.result) {
      await S.tw.wait(.25);
      if (W.ptrs?.size) turn += Math.abs(W.yaw - y); y = W.yaw;
      if (turn > .3) break;
      if (S.t - t0 > 20 && !tag.classList.contains('on')) { await hand(S, 'turn'); }
      if (S.t - t0 > 60) break;
    }
  } finally { clearInterval(iv); tag.classList.remove('on'); setTimeout(() => tag.remove(), 300); }
}
let kcss = false;
function keepCss() {
  if (kcss) return; kcss = true;
  const s = document.createElement('style');
  s.textContent = `.tbkeep{position:absolute;z-index:31;pointer-events:none;translate:-50% -100%;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 18px 7px;border-radius:18px;background:#fff;color:#3b2a55;border:3px solid #3b2a55;box-shadow:0 4px 0 rgba(59,42,85,.25);opacity:0;transition:opacity .15s;white-space:nowrap}
.tbkeep b{font-size:26px;line-height:1.1;color:#ff4f7b}.tbkeep span{font-size:15px}
.tbkeep::after{content:'';position:absolute;left:50%;bottom:-13px;margin-left:-10px;border:10px solid transparent;border-top-color:#3b2a55;border-bottom:0}
.tbkeep.on{opacity:1}`;
  document.head.append(s);
}

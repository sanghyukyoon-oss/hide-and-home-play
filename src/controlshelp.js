// 조작 도움말 (10/20, user on the phone: "2판 끝나면 결과 팝업과 같이 조작법 요약(이동·돌림판·끌다가 톡·두 번 톡)", "두 번 나오지
// 않게 팝업 하나로", "조작 도움말 화면에 1~10판까지 버튼으로 다시 볼 수 있게").
//   controlsBlock()  the four controls, each with its little hand moving — goes into 2판's result panel (one popup, not two)
//   openHelp(G)      a panel: the same four, and 1판~10판 buttons — each shows what that stage teaches, hands and all
// Every line is the 스토리 룸's own (DO, the double-tap lesson, the tap rule, the lock card, the kit talk); only the four
// short names and the panel's own words are new here (K(), for the 스토리 룸 to change).
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';
import { h, ICON } from './ui.js';
import { DO, learnedCards, KIT_TALK, CONTROLS_SUM } from './script.js';
import { DBL_TXT } from './teachdbl.js';
import { TAP_TXT } from './taps.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
const T = {
  title: K('조작 도움말', 'How to Play'), sum: K('조작 정리', 'Controls'), stages: K('판별로 다시 보기', 'Stage by stage'),
  none: K('이 판엔 새 조작이 없어. 지금까지 배운 걸로 충분해!', "Nothing new here. What you've learned is all you need!"),
  stageN: K('{n}판', 'Stage {n}'), back: K('조작 정리로', 'Back to controls'),
  drag: K('드래그', 'Drag'), dial: K('돌림판', 'Dial'), ftap: K('드래그 중 터치', 'Drag + tap'), dtap: K('두 번 터치', 'Double tap'),
};
const GRAY_LINE = '색을 잃은 방! 찾을 때마다 색이 돌아와 — 큰 가구도 찾아 봐';   // (stage.js's own 흑백 line, already in English)

// the four controls: a moving hand (the lessons' own hand animations) and a short name with the lesson's line
export const CONTROLS = [
  { cls: 'swipe', k: T.drag, line: DO.move },
  { cls: 'dialr', k: T.dial, line: DO.turnDial },
  { cls: 'ftap', k: T.ftap, line: DO.ftapOn },
  { cls: 'dtap', k: T.dtap, line: DBL_TXT.tip },
];
// what each of 1판~10판 teaches (레벨 1~10 순서: 1 돌림판 · 2 서랍+끌다가 콕 · 3 콕콕·콕 수 · 4 흑백 · 5 열쇠 · 7 도르래 · 8 조립)
const card = k => { const c = learnedCards({ save: {} }).find(x => x.k === k); return c ? c.s.map(([ico, s]) => ({ ico, line: s })) : []; };
const STAGES = {
  1: () => [{ cls: 'swipe', line: DO.move }, { cls: 'dialr', line: DO.turnDial }, { cls: 'tap', line: DO.box }],
  2: () => [{ cls: 'tap', line: DO.drawer }, { cls: 'ftap', line: DO.ftap }],
  3: () => [{ cls: 'dtap', line: DBL_TXT.tip }, { ico: '👆', line: TAP_TXT.body }, { ico: '🗄️', line: TAP_TXT.free }],
  4: () => [{ ico: '🎨', line: GRAY_LINE }],
  5: () => card('pad'),
  7: () => [{ ico: '⚙️', line: K('돌아가는 장치는 터치해서 돌려 봐. 뭐가 움직일지 몰라!', 'Tap anything that turns to give it a spin. Something might move!') }],   // (스토리 룸 10/20: 도르래를 처음 만지는 판)
  8: () => [{ ico: '🤖', line: KIT_TALK.robot.hid }, { ico: '🔢', line: KIT_TALK.robot.wrong }],
};

// 끌다가 터치 (10/20 저녁, 2판 수업을 손 두 개 시범으로 바꾸면서 — "말로 설명하지 말고 보여 주세요"): the little room slides with
// the dragging hand, a second fingertip touches once (the ripple), and the same drag now spins the room
const demo = (cls, sm = false) => cls === 'ftap'
  ? h('div', { class: 'chdemo ftapd' + (sm ? ' sm' : '') }, h('div', { class: 'fdroom' }), h('div', { class: 'fdtouch' }), h('div', { class: 'hand fdhand', html: ICON.hand }))
  : h('div', { class: 'chdemo' + (sm ? ' sm' : '') }, h('div', { class: 'hand ' + cls, html: ICON.hand }));
const row = r => h('div', { class: 'chrow' },
  r.cls ? demo(r.cls) : h('div', { class: 'chdemo ico' }, r.ico || ''),
  h('div', { class: 'chtxt' }, ...(r.k ? [h('b', {}, tr(r.k))] : []), h('span', {}, tr(r.line))));

// the summary tiles: the 스토리 룸's own lines (CONTROLS_SUM: 콕 · 끌기 · 돌림판 · 콕콕), and 끌다가 콕 (taught in 2판, on the
// user's list) — two to a row, so the result panel stays short
const FTAP_SUM = K('드래그 중 터치: 방 빙글', 'Drag + tap: spin the room');   // (문구: 스토리 룸 10/20 저녁 — 글자 수업이 없어져 '십자 가운데'는 뺌)
function sumTiles() {
  const rows = CONTROLS_SUM?.rows || [], pick = (pre, alt) => rows.find(r => r.startsWith(pre)) || alt;
  const tiles = [{ cls: 'tap', text: pick('터치:', null) }, { cls: 'swipe', text: pick('드래그:', DO.move) }, { cls: 'dialr', text: pick('돌림판:', DO.turnDial) },
    { cls: 'ftap', text: FTAP_SUM }, { cls: 'dtap', text: pick('두 번 터치:', DBL_TXT.tip) }].filter(x => x.text);
  return h('div', { class: 'chgrid' }, ...tiles.map(x => h('div', { class: 'chtile' }, demo(x.cls, true), h('span', {}, tr(x.text)))));
}
// 2판's result panel: the tiles under a small heading
export function controlsBlock() {
  css();
  return h('div', { class: 'chblock' }, h('div', { class: 'chhead' }, tr(CONTROLS_SUM?.title || T.sum)), sumTiles());
}

// the help panel (pause · 더보기): the four, then 1판~10판; a stage button swaps the list for that stage's lessons
export function openHelp(G, { onClose = null } = {}) {
  css();
  const list = h('div', { class: 'chlist' }), head = h('div', { class: 'chhead' });
  const show = n => {
    head.textContent = n ? tr(T.stageN).replace('{n}', n) : tr(CONTROLS_SUM?.title || T.sum);
    if (!n) list.replaceChildren(sumTiles());
    else { const rows = STAGES[n]?.() || []; list.replaceChildren(...(rows.length ? rows.map(row) : [h('div', { class: 'chnone' }, tr(T.none))])); }
    btns.forEach((b, i) => b.classList.toggle('on', i + 1 === n));
    back.style.visibility = n ? '' : 'hidden';
  };
  const btns = Array.from({ length: 10 }, (_, i) => { const b = h('button', { class: 'chst' }, String(i + 1)); b.addEventListener('pointerup', e => { e.stopPropagation(); G.audio.sfx('click'); show(i + 1); }); return b; });
  const back = h('button', { class: 'chback' }, tr(T.back)); back.addEventListener('pointerup', e => { e.stopPropagation(); G.audio.sfx('click'); show(0); });
  G.ui.panel({ title: T.title, color: 'blue', cls: 'chpanel', close: () => onClose?.(),
    body: [h('div', { class: 'chblock' }, head, list), h('div', { class: 'chhead' }, tr(T.stages)), h('div', { class: 'chstages' }, ...btns), back],
    buttons: [G.ui.btn('알겠어!', { color: 'green', onClick: () => { G.ui.closePanel(); onClose?.(); } })] });
  show(0);
}

let done = false;
function css() {
  if (done) return; done = true;
  document.head.append(h('style', {}, `
.chblock { margin: 4px 0 8px; }
.chhead { font-size: 15px; color: #8a6fae; margin: 6px 0 4px; text-align: center; }
.chrow { display: flex; align-items: center; gap: 10px; padding: 6px 4px; border-top: 2px dashed #f1e2d0; text-align: left; }
.chrow:first-of-type { border-top: 0; }
.chdemo { position: relative; flex: none; width: 64px; height: 52px; border-radius: 14px; background: #f6ecdf; overflow: hidden; }
.chdemo.ico { display: flex; align-items: center; justify-content: center; font-size: 28px; }
.chdemo .hand { width: 40px; height: 40px; margin: 0; left: 26px; top: 12px; z-index: 1; }
.chtxt { display: flex; flex-direction: column; font-size: 16px; line-height: 1.25; word-break: keep-all; }
.chtxt b { font-size: 18px; color: #3b2a55; }
.chgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.chtile { display: flex; align-items: center; gap: 6px; background: #fbf3e8; border-radius: 12px; padding: 4px 6px; font-size: 14px; line-height: 1.2; text-align: left; word-break: keep-all; color: #3b2a55; }
.chdemo.sm { width: 40px; height: 36px; border-radius: 10px; }
.chdemo.sm .hand { width: 28px; height: 28px; left: 15px; top: 8px; }
.chnone { padding: 12px 6px; font-size: 16px; color: #6b5a80; word-break: keep-all; }
.chstages { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 2px 0 6px; }
.chst { font: inherit; font-size: 18px; padding: 6px 0; border-radius: 12px; border: 2.5px solid #3b2a55; background: #fff; color: #3b2a55; }
.chst.on { background: #ffd23f; }
.chback { font: inherit; font-size: 15px; border: 0; background: none; color: #8a6fae; text-decoration: underline; padding: 2px 6px; }
.ftapd .fdroom { position: absolute; left: 50%; top: 46%; width: 24px; height: 24px; margin: -12px 0 0 -12px; border-radius: 5px; background: linear-gradient(#ff9fb5 0 32%, #f3c98b 32%); box-shadow: inset 0 0 0 2.5px #3b2a55; animation: fdroom 3.2s ease-in-out infinite; }
.ftapd.sm .fdroom { width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 4px; box-shadow: inset 0 0 0 2px #3b2a55; }
.ftapd .fdtouch { position: absolute; right: 7px; top: 6px; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 2.5px #ffd23f; opacity: 0; animation: fdtouch 3.2s ease-out infinite; }
.ftapd.sm .fdtouch { right: 3px; top: 3px; width: 8px; height: 8px; box-shadow: 0 0 0 2px #ffd23f; }
.ftapd .hand.fdhand { top: 22px; animation: fdhand 3.2s ease-in-out infinite; }
.ftapd.sm .hand.fdhand { top: 14px; }
@keyframes fdroom { 0%, 10% { transform: translateX(-5px); opacity: 0; } 14% { opacity: 1; } 36%, 48% { transform: translateX(3px) rotate(0); } 84% { transform: translateX(3px) rotate(80deg); opacity: 1; } 94%, 100% { transform: translateX(3px) rotate(80deg); opacity: 0; } }
@keyframes fdhand { 0%, 10% { transform: translate(-75%, -8%) scale(.9); opacity: 0; } 14% { opacity: 1; } 36%, 48% { transform: translate(-50%, -8%) scale(.9); } 84% { transform: translate(-5%, -8%) scale(.9); opacity: 1; } 94%, 100% { transform: translate(-5%, -8%) scale(.9); opacity: 0; } }
@keyframes fdtouch { 0%, 38% { opacity: 0; transform: scale(.4); } 41% { opacity: 1; transform: scale(1.2); } 46% { opacity: 1; transform: scale(1); } 52%, 100% { opacity: 0; transform: scale(1.6); } }
`));
}

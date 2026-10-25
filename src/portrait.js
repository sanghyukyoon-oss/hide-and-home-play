// 세로 전용 (10/26 사용자 "가로형 모드 빼고"): 앱은 매니페스트로 세로 고정(screenOrientation portrait)이고, 웹에서도 터치 기기를
// 가로로 돌리면 가로 비율로 맞춘 화면 대신 '세로로 돌려 주세요'를 덮고 판은 멈춰요(세로로 돌아오면 멈춤 패널의 계속으로 이어서).
// 마우스로 쓰는 데스크톱 창은 그대로. 브라우저가 허락하면(전체 화면·설치된 앱) 방향도 세로로 잠가요.
import { h } from './ui.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
const TXT = { turn: K('화면을 세로로 돌려 주세요', 'Please turn your screen upright'), why: K('숨바꼭집은 세로 화면 게임이에요', 'Hide & Home is played in portrait') };

export function installPortrait(G) {
  if (typeof matchMedia === 'undefined' || !matchMedia('(pointer: coarse)').matches) return;
  try { screen.orientation?.lock?.('portrait')?.catch?.(() => {}); } catch {}
  const css = document.createElement('style');
  css.textContent = `#portrait-only{position:fixed;inset:0;z-index:100000;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;
background:linear-gradient(#ffe3ef,#ffd0e4);color:#3a2453;font:600 20px/1.3 var(--font-display,system-ui);text-align:center;padding:24px}
#portrait-only small{font-size:14px;opacity:.75}
#portrait-only .ph{width:46px;height:78px;border:5px solid #3a2453;border-radius:10px;animation:ptturn 1.6s ease-in-out infinite}
@keyframes ptturn{0%,30%{transform:rotate(-90deg)}60%,100%{transform:rotate(0)}}
html.landscape-block #portrait-only{display:flex}`;
  document.head.append(css);
  document.body.append(h('div', { id: 'portrait-only' }, h('div', { class: 'ph' }), h('div', {}, tr(TXT.turn)), h('small', {}, tr(TXT.why))));
  // (a stage started while sideways, or one that came back from its pause on its own, pauses too — checked every half second)
  let on = false;
  const hold = () => { const S = G.scene; if (!on || !S || typeof S.pause !== 'function' || S.paused || !S.running) return; try { S.pause(); } catch {} };
  const fit = () => { on = innerWidth > innerHeight * 1.05; document.documentElement.classList.toggle('landscape-block', on); hold(); };
  addEventListener('resize', fit); addEventListener('orientationchange', fit); fit(); setInterval(hold, 500);
}

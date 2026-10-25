// 후보정 조절판 (10/22 사용자: "다음 빌드때 후보정 옵션 그냥 띄워줘. 여러가지로 해서 다양하게 잡아볼게 게이지바 같은 것도 주고").
// A small "후보정" button (top right, under the stage badge) opens sliders that change the post pass live. A moved slider wins over the stage's own
// value on every stage until 기본값 (kept on this device, localStorage 'sbk-fx'); 값 복사 copies the numbers to send back.
// Not in the Android app build. Test tool — goes before the store build (출품 전 정리).
import { IN_APP, QA_TOOLS } from './build.js';
import { SHADE } from './gfx/style.js';
// (user 10/25: "후보정이랑 치트? 세팅용 메뉴 … 제거하자") the team's only now: ?qa=1 (or ?fx=1) — not on the public page; a device's
// saved sliders are ignored without it, so a tester's look never leaks into a player's game
const FX_ON = !IN_APP && (QA_TOOLS || (typeof location !== 'undefined' && /[?&]fx=1(&|$)/.test(location.search)));

const KEY = 'sbk-fx';
// [key, label, min, max, step]
const SLIDERS = [
  ['sharpen', '언샵 마스크', 0, 1.6, .02],
  ['sharp2', '세밀 샤픈', 0, 2, .05],
  ['grade', '색보정', 0, 1.5, .05],
  ['warm', '색온도 (−차갑게 / +따뜻하게)', -1, 1, .05],
  ['sat', '채도', -.6, .6, .02],
  ['glow', '글로우 (밝은 곳 번짐)', 0, 1, .02],
  ['glowth', '글로우 문턱 (낮을수록 넓게)', .2, 1, .02],
  ['diffuse', '뽀샤시', 0, .6, .02],
  ['tilt', '틸트시프트 (위·아래 흐림)', 0, 1, .05],
  ['vign', '비네트 (가장자리 어둡게)', 0, .8, .02],
  // 셰이딩 (10/22 사용자: "하이라이트도 수치 후보정에서 편집 가능할까? 크기나 강도", "림라이트 어두운 쪽에") — style.js SHADE, every stage
  ['shine', '반짝 점 세기', 0, 1, .05],
  ['shineS', '반짝 점 크기', 0, 1, .05],
  ['shineF', '반짝 점 화면 가운데만 (0 어디서나 · 1 가운데)', 0, 1, .05],
  ['hl', '빛면 하이라이트 (1 = 끔)', 1, 1.6, .05],
  ['rim', '림라이트 세기 (어두운 쪽 테두리)', 0, 1.2, .05],
  ['rimW', '림라이트 두께', .05, .6, .01],
  ['shineM', '반짝 점 합성 (0 보통·1 더하기·2 스크린·3 오버레이)', 0, 3, 1],
  ['rimM', '림라이트 합성 (0 보통·1 더하기·2 스크린·3 오버레이)', 0, 3, 1],
];
// colours (user 10/22: "림라이트랑 하이라이트 색깔도 변경 가능?")
const COLORS = [['shineC', '반짝 점 색'], ['rimC', '림라이트 색']];
// the shading's own start values (not the stage's — they are the same on every stage)
const SH0 = { shine: SHADE.u.shineA.value, shineS: (.995 - SHADE.u.shineT.value) / .06, shineF: SHADE.u.shineFocus.value, hl: SHADE.hl, rim: SHADE.u.rimA.value, rimW: SHADE.u.rimW.value,
  shineM: SHADE.u.shineM.value, rimM: SHADE.u.rimM.value, shineC: '#' + SHADE.u.shineC.value.getHexString(), rimC: '#' + SHADE.u.rimC.value.getHexString() };
const NIGHT_SHINE = .35;   // 밤·정전 판의 반짝 점 (10/23 사용자 "어두울 때는 약하게")
let over = {};
if (FX_ON) try { over = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { over = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(over)); } catch { /* storage blocked: this visit only */ } };

// what the post pass has now (the stage's own values, before the sliders)
function current(P) {
  return { sharpen: P.du.sharpen.value, sharp2: P.du.sharp2?.value || 0, grade: P.gradeWant, warm: P.du.warm?.value || 0, sat: P.du.sat?.value || 0,
    glow: P.bloomOn ? P.bloomStr : 0, glowth: P.blu?.th?.value > 0 ? P.blu.th.value : .82, diffuse: P.du.diffuse?.value || 0, tilt: P.du.tilt?.value || 0, vign: P.du.vign?.value || 0, ...SH0,
    shine: P.nightShade ? SH0.shine * NIGHT_SHINE : SH0.shine };
}
let base = null;   // the stage's own values, remembered at each stage start (기본값 goes back to these)
// stage.js calls this after setting a stage's own look: the moved sliders go on top
export function applyFxOverrides(P) {
  if (!P?.du) return;
  base = current(P);
  put(P);
}
function put(P) {
  const v = { ...base, ...over };
  P.du.sharpen.value = v.sharpen;
  if (P.du.sharp2) P.du.sharp2.value = v.sharp2;
  P.gradeWant = v.grade;
  for (const k of ['warm', 'sat', 'vign', 'diffuse', 'tilt']) if (P.du[k]) P.du[k].value = v[k];
  P.bloomOn = v.glow > 0 || v.diffuse > 0 || v.tilt > 0 || (base.glow > 0 && !('glow' in over));
  P.bloomStr = v.tilt > 0 ? 0 : v.glow;   // (틸트시프트의 흐림은 그림 전체라, 그대로 더하면 화면이 하얗게 뜸)
  // one blur feeds all three: 틸트시프트 needs the whole picture (no threshold), 뽀샤시 nearly all of it, the glow only the bright parts
  if (P.blu?.th) P.blu.th.value = v.tilt > 0 ? -1 : v.diffuse > 0 ? .2 : v.glowth;
  SHADE.set({ shineFocus: v.shineF, shineA: v.shine, shineT: .995 - v.shineS * .06, hl: v.hl, rimA: v.rim, rimW: v.rimW, shineM: v.shineM, rimM: v.rimM, shineC: v.shineC, rimC: v.rimC });
}

export function installFxPanel(world) {
  if (!FX_ON || document.getElementById('fxbtn')) return;
  const css = document.createElement('style');
  css.textContent = `
#fxbtn{position:fixed;right:10px;top:calc(56px + env(safe-area-inset-top));z-index:9000;font:600 12px/1 system-ui,sans-serif;
  padding:8px 10px;border-radius:14px;border:2px solid #3a2a1e;background:#fff7e8;color:#3a2a1e;opacity:.85}
#fxpanel{position:fixed;left:6px;right:6px;bottom:calc(6px + env(safe-area-inset-bottom));z-index:9001;max-height:40vh;overflow:auto;
  background:rgba(255,250,240,.9);border:2px solid #3a2a1e;border-radius:14px;padding:6px 10px;font:12px/1.2 system-ui,sans-serif;color:#3a2a1e;display:none}
#fxpanel.on{display:block}
#fxpanel .row{margin:2px 0 4px}
#fxpanel .lab{display:flex;justify-content:space-between;font-weight:600}
#fxpanel .lab b{font-variant-numeric:tabular-nums}
#fxpanel .lab b.moved{color:#c2410c}
#fxpanel input[type=range]{width:100%;height:22px;margin:0;accent-color:#c2410c}
#fxpanel .btns{display:flex;gap:8px;position:sticky;bottom:-10px;background:rgba(255,250,240,.96);padding:6px 0}
#fxpanel button{flex:1;padding:7px;border-radius:10px;border:2px solid #3a2a1e;background:#fff;font:600 13px system-ui,sans-serif;color:#3a2a1e}
#fxpanel .note{font-size:11px;opacity:.7;margin-top:4px}`;
  document.head.append(css);
  const btn = document.createElement('button'); btn.id = 'fxbtn'; btn.textContent = '후보정';
  const pan = document.createElement('div'); pan.id = 'fxpanel';
  document.body.append(btn, pan);
  const P = () => world.post;
  const redraw = () => { world.dirty?.invalidate?.(); world.lastActive = performance.now(); };
  function render() {
    const p = P(); if (!p?.du) { pan.textContent = '판에 들어가면 조절할 수 있어요'; return; }
    if (!base) base = current(p);
    const v = { ...base, ...over };
    pan.innerHTML = '';
    for (const [k, label, min, max, step] of SLIDERS) {
      const row = document.createElement('div'); row.className = 'row';
      const lab = document.createElement('div'); lab.className = 'lab';
      const name = document.createElement('span'); name.textContent = label;
      const num = document.createElement('b'); num.textContent = (+v[k]).toFixed(2); if (k in over) num.className = 'moved';
      lab.append(name, num);
      const r = document.createElement('input'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = v[k];
      r.addEventListener('input', () => { over[k] = +r.value; num.textContent = (+r.value).toFixed(2); num.className = 'moved'; save(); put(P()); redraw(); });
      row.append(lab, r); pan.append(row);
    }
    for (const [k, label] of COLORS) {
      const row = document.createElement('div'); row.className = 'row lab';
      const name = document.createElement('span'); name.textContent = label; if (k in over) name.style.color = '#c2410c';
      const c = document.createElement('input'); c.type = 'color'; c.value = v[k]; c.style.cssText = 'width:64px;height:28px;border:2px solid #3a2a1e;border-radius:8px;padding:0';
      c.addEventListener('input', () => { over[k] = c.value; name.style.color = '#c2410c'; save(); put(P()); redraw(); });
      row.append(name, c); pan.append(row);
    }
    const btns = document.createElement('div'); btns.className = 'btns';
    const reset = document.createElement('button'); reset.textContent = '기본값';
    reset.onclick = () => { over = {}; save(); put(P()); redraw(); render(); };
    const copy = document.createElement('button'); copy.textContent = '값 복사';
    copy.onclick = () => {
      const vv = { ...base, ...over }, t = [...SLIDERS.map(([k, label]) => `${label.split(' (')[0]} ${(+vv[k]).toFixed(2)}${k in over ? ' *' : ''}`), ...COLORS.map(([k, label]) => `${label} ${vv[k]}${k in over ? ' *' : ''}`)].join(', ');
      (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => { copy.textContent = '복사됨!'; }, () => { window.prompt('값', t); });
      setTimeout(() => { copy.textContent = '값 복사'; }, 1400);
    };
    const close = document.createElement('button'); close.textContent = '닫기'; close.onclick = () => pan.classList.remove('on');
    btns.append(reset, copy, close); pan.append(btns);
    const note = document.createElement('div'); note.className = 'note';
    note.textContent = '움직인 값(주황)은 모든 판에 그대로 적용돼요. 글로우·뽀샤시·틸트시프트는 같은 흐림을 나눠 써서 틸트시프트를 켜면 나머지 둘이 약해져요.';
    pan.append(note);
  }
  btn.onclick = () => { const on = !pan.classList.contains('on'); if (on) render(); pan.classList.toggle('on', on); };
  for (const ev of ['pointerdown', 'touchstart', 'wheel']) pan.addEventListener(ev, e => e.stopPropagation(), { passive: true });
}

// 튜토리얼 B (③ 10/22, user: "지금 좀 과한 거 아닌가", "토순이집 들어가면 그냥 '이동 중에 터치를 하면 회전으로 잠시 바뀌어요' 이런 안내
// 하나면"): a lighter start. B is the default since 10/22 (user: "b로 하고 글자 노출 시간 좀 더 늘려"); ?tut=a or 더보기 → 튜토리얼 B 끄기
// brings back the old lessons (A) on this device.
//  1판: as A (user 10/22 "1은 원래 것이 나은 것 같음"; tutB1 below is kept, unused), but in the order 이동 → 이동 중 터치 (the
//       three-beat lesson, teachftap ftapLesson1) → 돌림판 (user 10/25). 2판 unused → 3판 the three-beat play once (armFtapB).
//  2판: one line for 5 s — how to turn while moving (② 10/26 검토: "조작 안내는 짧게 한 번만" — the hand after 20 s is gone).
//       Turning at all ends it, quietly.
//  Gone in B: the three-beat lesson on 2판 (it is 1판 ② now), the tilt and double-tap lessons, the controls
//  summary on 2판's result (still in 더보기 → 조작 도움말).
import { h, ICON } from './ui.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';
import { Raycaster, Vector3 } from 'three';

const K = (ko, en) => { EN[ko] = en; return ko; };
const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const TUT_B = (() => { const q = QS.get('tut'); if (q === 'b' || q === 'a') { try { localStorage.setItem('sbk-tut', q); } catch {} return q === 'b'; } try { return localStorage.getItem('sbk-tut') !== 'a'; } catch { return true; } })();
export function setTutB(on) { try { localStorage.setItem('sbk-tut', on ? 'b' : 'a'); } catch {} }
export const TUTB_TXT = {
  // (② 10/26 마지막 정리 — 허브 추천안·사용자 "떼지마 멘트가 쎄지 않음? 터치하고 나면 회전에 대해서 설명하는 멘트로"): one line at a time, the
  // same words in 1판·2판·3판's 개굴이 lesson; '떼지 마!' is gone everywhere
  look: K('드래그해서 둘러봐!', 'Drag to look around!'),
  turn: K('드래그한 채로 다른 손가락으로 터치!', 'Keep dragging and tap with another finger!'),
  spin: K('빙글~ 방이 돌아가요! 손을 떼면 다시 이동', 'The room spins! Let go to move again'),
  // (user 10/26: "돌림판도 다른 회전 방법으로 설명해 주라니까 한 가지 돌리는 방법 더 있다고 일단 간결하게")
  dial: K('돌리는 방법 하나 더! 아래 돌림판을 드래그', 'Another way to spin: drag the dial below'),
  // (1판 10/26: one card, words only — move, turn and the dial together; and the 돋보기 once when stuck)
  how: K('드래그로 둘러보고, 드래그하면서 다른 손가락으로 한 번 터치하면 방이 빙글 돌아요', 'Drag to look around. While dragging, tap once with another finger to spin the room'),
  dial2: K('돌림판으로도 방을 돌릴 수 있어요', 'The dial spins the room too'),
  mag: K('막히면 돋보기!', 'Stuck? Try the magnifier!'),
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
// 2판: nothing if the turn was used on 1판; else the same one line as 1판 (②→③), once
export async function tutB2(S) {
  const T = S.G.save.tut || {};
  if (T.ftap || T.ftapUsed) return;
  for (let i = 0; i < 40 && (S.talking || S.cine || S.G.world.flying || !S.running); i++) await S.tw.wait(.25);
  if (!S.dead && !S.result) await turnLine1(S);
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

// 1판 ② (② 레벨 10/26, user on the phone: "한 문장 나오는 튜토가 바로 나와야 되는데 그러고 회전판 설명해야" — no three-beat play on
// 1판 any more): the one line, the "떼지 마!" tag over a dragging finger, done once a drag-then-touch turn has gone ~20° (or 15 s)
export async function turnLine1(S) {
  const G = S.G, W = G.world;
  if (W.scheme !== 'F' || S.botOn?.()) return false;
  while (!S.dead && !S.result && (S.tutEls || S.t - (S._tutEnd ?? -9) < 1.2)) await S.tw.wait(.2);
  if (S.dead || S.result) return false;
  // one bubble: ② shows once a finger has dragged ~1 s (or after 4 s of nothing), ③ takes its place the moment the room turns,
  // for 1.5 s, then it's done (20 s and no turn: it goes quietly)
  const colour = k => tr(TUTB_TXT[k]).replace(/드래그한 채로|Keep dragging/, w => `<span class="tkw mv">${w}</span>`).replace(/빙글~|spins!/, w => `<span class="tkw tn">${w}</span>`);
  // (the card goes on the screen with its words already in it: put up empty, its own pop animation showed a blank box first — user
  // 10/26 "글자 나오기 전에 뭐 이상한 네모 뜬다")
  const line = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .2}px` });
  S.tutEls = [line];
  let said = null; const say = k => { if (k === said) return; said = k; line.innerHTML = colour(k); if (!line.isConnected) G.ui.tut.append(line); };
  const t0 = S.t; let held = 0, spinT = null, ok = false;
  try {
    while (!S.dead && !S.result && S.t - t0 < 20) {
      const spin = W.eMode === 'turn' && W.eBase !== 'turn' && W.ptrs.size > 0 && !W._tdHeld;
      if (spin && spinT == null) { spinT = S.t; say('spin'); G.audio.sfx('special'); }
      if (spinT != null) { if (S.t - spinT >= 1.5 && !W.ptrs.size) { ok = true; break; } if (S.t - spinT >= 3) { ok = true; break; } }
      else {
        held = W.ptrs.size === 1 ? held + .05 : 0;
        if (held >= 1 || S.t - t0 > 4) say('turn');
      }
      await S.tw.wait(.05);
    }
  } finally {
    line.remove(); if (S.tutEls?.[0] === line) { S.tutEls = null; S._tutEnd = S.t; }
  }
  if (ok) { const T = G.save.tut || (G.save.tut = {}); T.ftap = 1; G.persist?.(); }
  return ok;
}
// 1판 (user: "하나 찾으니까 종료된다 … 몇 개 눈에 보이는 거 좀 더 찾게"): beside the friend in the toy box, three things lying in
// plain sight around 토순이's room — on top of things, toward you, one per piece of furniture — so the moves get some use first
// (10/26 user: "스테이지 1 찾는 물건 하나 줄여주고" — 토순이 + 2)
export const FIRST_FINDS = ['star', 'gift'];
export function firstFinds(plan, room) {
  if (!plan?.first) return plan;
  const used = new Set(plan.placements.map(p => p.spot)), furns = new Set(), V = room.spotWorld ? null : null; void V;
  const at = s => (room.spotWorld ? room.spotWorld(s) : s.anchor.getWorldPosition(new s.anchor.position.constructor()));
  // (nothing over it within 1.2 m: the desk under the loft hid the gift from every turn of the dial — ② 10/26 손 시험)
  room.group.updateMatrixWorld(true);
  const ray = new Raycaster(), up = new Vector3(0, 1, 0);
  const open = p => { ray.set(new Vector3(p.x, p.y + .25, p.z), up); ray.far = 1.2; return !ray.intersectObject(room.group, true).some(h => h.object.visible && !h.object.userData.proxy); };
  const c = room.spots.filter(s => s.kind === 'on' && !s.part && !s.reserved && !used.has(s) && s.maxH >= .17 && (s.scale || 1) >= .65)
    .map(s => ({ s, p: at(s) })).filter(o => o.p.y < 1.3 && open(o.p)).sort((a, b) => (b.p.x + b.p.z) - (a.p.x + a.p.z));
  for (const type of FIRST_FINDS) {
    const o = c.find(o => !used.has(o.s) && !furns.has(o.s.furn)) || c.find(o => !used.has(o.s));
    if (!o) break;
    used.add(o.s); furns.add(o.s.furn);
    plan.placements.push({ type, spot: o.s, role: 'target' }); plan.targets.push(type);
  }
  return plan;
}
// 1판: once the friend is found, 토순이 says what she dropped (스토리 룸 10/26 — the things by name, not where)
export const FIRST_SAY = [
  // (스토리 룸 10/26: 1판 시작 줄 "이번엔 안 웃을 거야"의 받아치기 — 빠진 카드의 웃음을 이 줄에)
  K('푸핫! 웃어 버렸다. …아, 숨다가 떨어뜨린 게 있어.', 'Pfft! I laughed. …Oh, I dropped some things while hiding.'),
  K('별이랑 선물! 같이 찾아 줘!', 'A star and a gift! Help me find them!'),
];
export async function firstFindsTalk(S) {
  const fr = () => S.targets.find(t => t.friend);
  // (after the friend is found and the lesson's lines are done: one line at a time)
  while (!S.dead && !S.result && (!fr()?.found || S.tutStep !== 3 || S.tutEls)) await S.tw.wait(.3);
  if (S.dead || S.result || S.targets.every(t => t.found)) return;
  for (let i = 0; i < 30 && (S.talking || S.cine || S.G.world.flying) && !S.dead; i++) await S.tw.wait(.2);
  const who = S.friend?.root ? S.friend : null; if (!who || S.dead || S.result) return;
  // (the first line is said in close as she pops out — revealFriend; here, back at your view, the one asking for the rest)
  for (let i = 0; i < 20 && !S._firstBack && !S.dead; i++) await S.tw.wait(.2);
  if (!S.dead && !S.result) S.sayNow(who, FIRST_SAY[1], 2600);
}

// 1판 (10/26 user: "드래그로 둘러보고 드래그하면서 다른손가락으로 터치를 한번 하면 돌아가요 … 돌림판으로도 돌아가요 2개로 … 이동중에 클릭 한번인데
// 그걸 무슨소린지 모르는 경우가 많음"): card 1 — the words and a little 1.5 s loop inside it (one finger slides, another taps 퐁 once, the
// little room spins); it closes once you've turned the room yourself (or after 10 s). Card 2 right after — the dial, pointed at briefly.
export async function howCard(S) {
  const G = S.G, W = G.world;
  while (!S.dead && !S.result && (S.tutEls || S.talking || S.cine || W.flying)) await S.tw.wait(.2);
  if (S.dead || S.result) return;
  howCss();
  const txt = tr(TUTB_TXT.how).replace(/드래그로|Drag/, w => `<span class="tkw mv">${w}</span>`).replace(/한 번 터치|tap once/, w => `<span class="tkw tn">${w}</span>`);
  const demo = h('div', { class: 'hw-demo' }, h('div', { class: 'hw-room' }, h('i'), h('i'), h('i')), h('div', { class: 'hw-f1', html: ICON.hand }), h('div', { class: 'hw-f2', html: ICON.hand }), h('div', { class: 'hw-pong' }));
  const card = h('div', { class: 'tip hw-card', style: `left:50%;top:${innerHeight * .18}px` }, h('div', { html: txt }), demo);
  G.ui.tut.append(card); S.tutEls = [card];
  const t0 = S.t; let spunAt = null;
  try {
    while (!S.dead && !S.result && S.t - t0 < 10) {
      const spin = W.eMode === 'turn' && W.eBase !== 'turn' && W.ptrs.size > 0 && !W._tdHeld;
      if (spin && spunAt == null) { spunAt = S.t; const T = G.save.tut || (G.save.tut = {}); T.ftap = 1; T.ftapUsed = 1; G.persist?.(); }
      if (spunAt != null && S.t - spunAt > .8) break;
      await S.tw.wait(.1);
    }
  } finally { card.remove(); if (S.tutEls?.[0] === card) { S.tutEls = null; S._tutEnd = S.t - 2; } }
  if (S.dead || S.result) return;
  // card 2, straight after: the dial, a hand on it for a moment
  const dial = W.turnDial instanceof Element ? W.turnDial : W.turnDial?.el || document.querySelector('.turndial');
  if (dial) {
    let dl = 0; const prevR = W.onRotate; W.onRotate = d => { prevR?.(d); if (W._tdHeld) dl += Math.abs(d) || 0; };
    const at = () => { const b = dial.getBoundingClientRect(); return b.width ? { sx: b.left + b.width / 2, sy: b.top + b.height / 2 } : null; };
    await S.teach(TUTB_TXT.dial2, 'dialr', at, () => dl > .4, null, 4);
    W.onRotate = prevR;
  }
}
let hcss = false;
function howCss() {
  if (hcss) return; hcss = true;
  const s = document.createElement('style');
  s.textContent = `.hw-card{max-width:min(330px,calc(100vw - 32px));display:flex;flex-direction:column;align-items:center;gap:6px}
.hw-demo{position:relative;width:150px;height:74px;border-radius:12px;background:rgba(59,42,85,.08);overflow:hidden}
.hw-room{position:absolute;left:52px;top:14px;width:46px;height:46px;transform:rotateX(55deg) rotateZ(45deg);border-radius:6px;background:#ffd9c2;border:2px solid #3b2a55;animation:hwSpin 1.5s ease-in-out infinite}
.hw-room i{position:absolute;width:12px;height:12px;border-radius:3px;background:#8fd3f4}.hw-room i:nth-child(1){left:5px;top:5px}.hw-room i:nth-child(2){right:5px;top:5px;background:#ffe14d}.hw-room i:nth-child(3){left:5px;bottom:5px;background:#ff8fb8}
.hw-f1,.hw-f2{position:absolute;width:30px;height:30px;opacity:.95}.hw-f1 svg,.hw-f2 svg{width:100%;height:100%}
.hw-f1{left:14px;top:38px;animation:hwSlide 1.5s ease-in-out infinite}
.hw-f2{left:108px;top:6px;opacity:0;animation:hwTap 1.5s ease-in-out infinite}
.hw-pong{position:absolute;left:112px;top:10px;width:20px;height:20px;border-radius:50%;border:3px solid #ffe14d;opacity:0;animation:hwPong 1.5s ease-out infinite}
@keyframes hwSlide{0%{transform:translateX(0)}60%{transform:translateX(26px)}100%{transform:translateX(26px)}}
@keyframes hwTap{0%,25%{opacity:0;transform:translateY(-6px)}35%{opacity:1;transform:translateY(0)}48%{opacity:1;transform:translateY(0)}58%,100%{opacity:0;transform:translateY(-6px)}}
@keyframes hwPong{0%,36%{opacity:0;transform:scale(.4)}40%{opacity:1;transform:scale(.6)}62%{opacity:0;transform:scale(1.6)}100%{opacity:0}}
@keyframes hwSpin{0%,40%{transform:rotateX(55deg) rotateZ(45deg)}80%,100%{transform:rotateX(55deg) rotateZ(135deg)}}`;
  document.head.append(s);
}
// 1판, stuck 15 s: the 돋보기 button bounces and says so once, just above it
export function pointMag(S) {
  const b = S.hintBtn; if (!b) return;
  const r = b.getBoundingClientRect();
  const tip = h('div', { class: 'tip', style: `left:${Math.max(110, r.left + r.width / 2)}px;top:${Math.max(80, r.top - 64)}px`, html: tr(TUTB_TXT.mag) });
  S.G.ui.tut.append(tip); S.tutEls = [tip]; S._magTip = tip;
  b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 600);
  setTimeout(() => { tip.remove(); if (S.tutEls?.[0] === tip) { S.tutEls = null; S._tutEnd = S.t; } }, 3500);
}

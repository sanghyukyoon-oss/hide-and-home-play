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
  look: K('드래그로 둘러봐요', 'Drag to look around'),
  turn: K('드래그 + 다른 손가락 한 번 터치 = 회전!', 'Drag + one tap with another finger = rotate!'),
  spin: K('회전 중! 손을 떼면 다시 둘러보기', 'Rotating! Let go to look around again'),
  dial: K('돌리는 방법 하나 더! 아래 돌림판을 드래그', 'Another way to spin: drag the dial below'),
  // (1판 10/26: one card, words only — move, turn and the dial together; and the 돋보기 once when stuck)
  // (1판 10/26 실폰: "처음에 너무 길긴한데 … 조금 짧게 해주고 좀 위로 올려줘. 누르면 사라지게도") two short lines, a short dial line
  // (1판 10/26 user: "이동중에 다른손으로 터치 한번 하면 회전으로 바뀜 이거 진짜 설명 어렵다" → 사용자가 고른 문구; the switch is shown by the loop)
  how: K('드래그 = 화면 이동\n드래그 + 다른 손가락 한 번 터치 = 회전!', 'Drag = move the view\nDrag + one tap with another finger = rotate!'),
  dial2: K('돌림판으로도 돌려요', 'Or turn it with the dial'),
  close: K('터치해서 닫기', 'Tap to close'),
  mag: K('막히면 돋보기!', 'Stuck? Try the magnifier!'),
  fbHold: K('꾹 누른 채로!', 'Keep holding!'), fbSpin: K('회전!', 'Rotate!'),
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
  const colour = k => tr(TUTB_TXT[k]).replace(/회전으로 변신!|rotate mode!/, w => `<span class="tkw tn">${w}</span>`).replace(/회전 중!|Rotating!/, w => `<span class="tkw tn">${w}</span>`);
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
  K('푸핫! 웃어 버렸다. …아, 숨다가 떨어뜨린 게 있어.', 'Pfft! I giggled. …Oh, I dropped some things while hiding.'),
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
  // (seen and used once — a replay or coming back to 1판 goes straight to finding; never turned yet → it shows again)
  const TT = G.save.tut || (G.save.tut = {}); if (TT.how1 && TT.ftap) return;
  while (!S.dead && !S.result && (S.tutEls || S.talking || S.cine || W.flying)) await S.tw.wait(.2);
  if (S.dead || S.result) return;
  howCss();
  const txt = tr(TUTB_TXT.how).replace(/화면 이동|move the view/, w => `<span class="tkw mv">${w}</span>`).replace(/회전!|rotate!/, w => `<span class="tkw tn">${w}</span>`).split('\n').map(l => `<div class="hw-ln">${l}</div>`).join('');   // (10/26 사용자 A안: 두 줄을 같은 꼴로, 배지는 줄 끝 결과에만)
  const demo = h('div', { class: 'hw-demo' }, h('div', { class: 'hw-room' }, h('i'), h('i'), h('i')), h('div', { class: 'hw-f1', html: ICON.hand }), h('div', { class: 'hw-f2', html: ICON.hand }), h('div', { class: 'hw-pong' }), h('div', { class: 'hw-mode' }, '↻'));
  // (up under the top bar — the room and 토순이 stay clear; a touch on it closes it, so does a turn of the room, so do 8 s)
  const card = h('div', { class: 'tip hw-card', style: 'left:50%;top:calc(66px + var(--safeT, 0px))' }, h('div', { class: 'hw-txt', html: txt }));   // (10/26 사용자 "쓸데없는거 정리해줘": the two lines only — no loop picture, no '터치해서 닫기')
  let shut = false; card.addEventListener('pointerdown', e => { e.stopPropagation(); shut = true; });
  G.ui.tut.append(card); S.tutEls = [card]; TT.how1 = 1; G.persist?.();
  const t0 = S.t; let spunAt = null;
  // (10/26 사용자: "손가락보다 좀 위에 말풍선으로… 클릭하고 나면 화면 회전! 문구"): while one finger drags, a small bubble just above it
  // says to keep holding; the moment the other finger's tap turns the drag into turning, it says 회전! and goes. 1판 card only
  const fb = h('div', { class: 'hw-bub hw-fb', style: 'opacity:0' }); G.ui.tut.append(fb);
  const fbAt = () => { const f = W.ptrs?.size ? [...W.ptrs.values()][0] : null; if (f) { fb.style.left = f.x + 'px'; fb.style.top = (f.y - 64) + 'px'; } return f; };
  try {
    while (!S.dead && !S.result && !shut && S.t - t0 < 15) {
      { const f = fbAt(), turning = W.eMode === 'turn' && W.eBase !== 'turn' && W.ptrs.size > 0 && !W._tdHeld;
        const say = spunAt != null ? (S.t - spunAt < 1.6 ? tr(TUTB_TXT.fbSpin) : '') : (f && W.ptrs.size === 1 && !turning ? tr(TUTB_TXT.fbHold) : '');
        if (fb.textContent !== say) fb.textContent = say; fb.style.opacity = say && f ? '1' : '0'; }   // (10/26 사용자 "약간 더 길게… 다 읽히기전에 넘어가서": 8 → 15 s)
      const spin = W.eMode === 'turn' && W.eBase !== 'turn' && W.ptrs.size > 0 && !W._tdHeld;
      if (spin && spunAt == null) { spunAt = S.t; const T = G.save.tut || (G.save.tut = {}); T.ftap = 1; T.ftapUsed = 1; G.persist?.(); }
      if (spunAt != null && S.t - spunAt > 3) break;
      await S.tw.wait(.1);
    }
  } finally { fb.remove(); card.remove(); if (S.tutEls?.[0] === card) { S.tutEls = null; S._tutEnd = S.t - 2; } }
  if (S.dead || S.result) return;
  // card 2, straight after: the dial, a hand on it for a moment
  const dial = W.turnDial instanceof Element ? W.turnDial : W.turnDial?.el || document.querySelector('.turndial');
  if (dial) {
    let dl = 0; const prevR = W.onRotate; W.onRotate = d => { prevR?.(d); if (W._tdHeld) dl += Math.abs(d) || 0; };
    const at = () => { const b = dial.getBoundingClientRect(); return b.width ? { sx: b.left + b.width / 2, sy: b.top + b.height / 2 } : null; };
    const atTop = () => { const b = dial.getBoundingClientRect(); return b.width ? { sx: b.left + b.width / 2, sy: b.top } : null; };
    await bubble(S, TUTB_TXT.dial2, atTop, () => dl > .4, 5, .44);   // (leans left, clear of the zoom bar above the dial)   // (10/26 사용자 "돋보기랑 돌림판은 말풍선같이")
    W.onRotate = prevR;
  }
}
let hcss = false;
function howCss() {
  if (hcss) return; hcss = true;
  const s = document.createElement('style');
  s.textContent = `.hw-card{max-width:calc(100vw - 16px);display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:auto;padding:8px 12px 6px}
.hw-txt{font-size:min(17px,4.4vw);line-height:1.5;text-align:center;white-space:nowrap}   /* (10/26 사용자 "약간 작게 느껴지는데… 글자 정렬 잘": 3 lines, bigger, every piece on one middle line) */
.hw-ln{display:block;margin:2px 0}.hw-txt .tkw{display:inline-block;vertical-align:middle;line-height:1.3;margin-top:-3px}
.hw-ar{display:inline-block;width:1.1em;height:.8em;margin:0 .3em 0 0;vertical-align:middle;margin-top:-3px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 20'%3E%3Cpath d='M4 10h16M14 4l7 6-7 6' fill='none' stroke='%233b2a55' stroke-width='4.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat}
.hw-bub{position:absolute;z-index:31;transform:translate(-50%,-100%);background:#fffaf2;color:#3b2a55;border:3px solid #3b2a55;border-radius:16px;padding:8px 14px;font-size:15px;line-height:1.3;white-space:nowrap;box-shadow:0 3px 0 #3b2a55;pointer-events:none;animation:hwbub .35s cubic-bezier(.3,1.6,.5,1)}
.hw-bub::before,.hw-bub::after{content:'';position:absolute;left:var(--tx,50%);border:solid transparent;border-bottom:0}
.hw-bub::before{bottom:-15px;margin-left:-11px;border-width:14px 11px 0;border-top-color:#3b2a55}
.hw-bub::after{bottom:-9px;margin-left:-7px;border-width:9px 7px 0;border-top-color:#fffaf2}

.hw-fb{transition:opacity .15s;font-size:15px;padding:6px 12px}
@keyframes hwbub{from{transform:translate(-50%,-100%) scale(.6);opacity:0}}
.hw-x{font-size:11px;opacity:.55;align-self:flex-end;margin-top:-2px}
.hw-demo{position:relative;flex:none;width:170px;height:80px;border-radius:12px;background:rgba(59,42,85,.08);overflow:hidden;zoom:.6}
.hw-room{position:absolute;left:60px;top:16px;width:46px;height:46px;transform:translateX(-14px) rotateX(55deg) rotateZ(45deg);border-radius:6px;background:#ffd9c2;border:2px solid #3b2a55;animation:hwRoom 2.4s ease-in-out infinite}
.hw-room i{position:absolute;width:12px;height:12px;border-radius:3px;background:#8fd3f4}.hw-room i:nth-child(1){left:5px;top:5px}.hw-room i:nth-child(2){right:5px;top:5px;background:#ffe14d}.hw-room i:nth-child(3){left:5px;bottom:5px;background:#ff8fb8}
.hw-f1,.hw-f2{position:absolute;width:30px;height:30px;opacity:.95}.hw-f1 svg,.hw-f2 svg{width:100%;height:100%}
.hw-f1{left:10px;top:44px;animation:hwSlide 2.4s ease-in-out infinite}
.hw-f2{left:128px;top:6px;opacity:0;animation:hwTap 2.4s ease-in-out infinite}
.hw-pong{position:absolute;left:132px;top:10px;width:20px;height:20px;border-radius:50%;border:3px solid #ffe14d;opacity:0;animation:hwPong 2.4s ease-out infinite}
.hw-mode{position:absolute;left:40px;top:18px;width:24px;height:24px;border-radius:50%;background:#ff7eb0;color:#fff;font:bold 18px/24px sans-serif;text-align:center;opacity:0;animation:hwMode 2.4s ease-in-out infinite}
@keyframes hwRoom{0%{transform:translateX(-14px) rotateX(55deg) rotateZ(45deg)}32%,46%{transform:translateX(10px) rotateX(55deg) rotateZ(45deg)}84%,100%{transform:translateX(10px) rotateX(55deg) rotateZ(135deg)}}
@keyframes hwSlide{0%{transform:translateX(0)}32%,46%{transform:translateX(24px)}84%,100%{transform:translateX(50px)}}
@keyframes hwTap{0%,33%{opacity:0;transform:translateY(-6px)}38%,44%{opacity:1;transform:translateY(0)}50%,100%{opacity:0;transform:translateY(-6px)}}
@keyframes hwPong{0%,38%{opacity:0;transform:scale(.4)}41%{opacity:1;transform:scale(.6)}58%,100%{opacity:0;transform:scale(1.6)}}
@keyframes hwMode{0%,40%{opacity:0;transform:scale(.3)}46%{opacity:1;transform:scale(1.3) translateX(24px)}52%,86%{opacity:1;transform:scale(1) translateX(24px)}95%,100%{opacity:0;transform:scale(1) translateX(50px)}}
`;
  document.head.append(s);
}
// 1판, stuck 15 s: the 돋보기 button bounces and says so once, just above it
export function pointMag(S) {
  const b = S.hintBtn; if (!b) return;
  b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 600);
  const at = () => { const r = b.getBoundingClientRect(); return r.width ? { sx: r.left + r.width / 2, sy: r.top } : null; };
  bubble(S, TUTB_TXT.mag, at, () => false, 4);
}
// a speech bubble over a button (돋보기·돌림판), its tail pointing down at it; gone after `secs` or once done() is true
async function bubble(S, txt, at, done, secs, lean = 0) {
  howCss();
  const p = at(); if (!p) return;
  const el = h('div', { class: 'hw-bub', html: tr(txt) });
  S.G.ui.tut.append(el); S.tutEls = [el]; if (txt === TUTB_TXT.mag) S._magTip = el;   // (stage.js useHint takes it away when the 돋보기 is pressed)
  const place = () => {
    const q = at(); if (!q) return;
    const w = el.offsetWidth || 160, x = Math.max(w / 2 + 10, Math.min(innerWidth - w / 2 - 10, q.sx - w * lean));
    el.style.left = x + 'px'; el.style.top = (q.sy - 20) + 'px'; el.style.setProperty('--tx', Math.max(22, Math.min(w - 22, q.sx - x + w / 2)) + 'px');   // (10/26 사용자 "가려지지 않게": the tail's tip stops above the button)
  };
  place();
  const t0 = S.t;
  try { while (!S.dead && !S.result && el.isConnected && S.t - t0 < secs && !done()) { place(); await S.tw.wait(.1); } }
  finally { el.remove(); if (S.tutEls?.[0] === el) { S.tutEls = null; S._tutEnd = S.t; } }
}

// (1판 10/26 허브: "터치했더니 뭔가 바뀌었다를 몸으로") — while a drag has been switched to turning by another finger, a ↻ rides beside
// that finger; gone when it lifts. Every stage; big on 1판
export function spinBadge(S) {
  const W = S.G.world, big = S.idx === 0;
  const el = h('div', { style: `position:absolute;z-index:32;pointer-events:none;width:${big ? 58 : 38}px;height:${big ? 58 : 38}px;margin:${big ? -29 : -19}px 0 0 ${big ? -29 : -19}px;border-radius:50%;background:#ff7eb0;color:#fff;border:3px solid #3b2a55;font:bold ${big ? 36 : 24}px/${big ? 52 : 32}px sans-serif;text-align:center;opacity:0;transform:scale(.4);transition:opacity .12s,transform .18s cubic-bezier(.3,1.6,.5,1)` }, '↻');
  S.G.ui.tut.append(el);
  let on = false;
  const tick = () => {
    if (S.dead) { el.remove(); return; }
    const turning = W.eMode === 'turn' && W.eBase !== 'turn' && W.ptrs?.size > 0 && !W._tdHeld;
    if (turning) { const f = [...W.ptrs.values()][0]; el.style.left = (f.x + (big ? 54 : 40)) + 'px'; el.style.top = (f.y - (big ? 54 : 40)) + 'px'; }
    if (turning !== on) { on = turning; el.style.opacity = on ? '1' : '0'; el.style.transform = on ? 'scale(1)' : 'scale(.4)'; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

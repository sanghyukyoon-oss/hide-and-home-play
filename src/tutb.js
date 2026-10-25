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

// 1판 ② (② 레벨 10/26, user on the phone: "한 문장 나오는 튜토가 바로 나와야 되는데 그러고 회전판 설명해야" — no three-beat play on
// 1판 any more): the one line, the "떼지 마!" tag over a dragging finger, done once a drag-then-touch turn has gone ~20° (or 15 s)
export async function turnLine1(S) {
  const G = S.G, W = G.world;
  if (W.scheme !== 'F' || S.botOn?.()) return false;
  while (!S.dead && !S.result && (S.tutEls || S.t - (S._tutEnd ?? -9) < 1.2)) await S.tw.wait(.2);
  if (S.dead || S.result) return false;
  const txt = tr(TUTB_TXT.turn).replace(/이동|dragging/, w => `<span class="tkw mv">${w}</span>`).replace(/회전|turn/, w => `<span class="tkw tn">${w}</span>`);
  const line = h('div', { class: 'tip', style: `left:50%;top:${innerHeight * .2}px`, html: txt });
  keepCss();
  const tag = h('div', { class: 'tbkeep' }, h('b', {}, tr(TUTB_TXT.keep)), h('span', {}, tr(TUTB_TXT.keep2)));
  G.ui.tut.append(line, tag); S.tutEls = [line, tag];
  let turned = 0, ok = false; const t0 = S.t, prev = W.onRotate;
  W.onRotate = d => { prev?.(d); if (W.eMode === 'turn' && W.eBase !== 'turn' && W.ptrs.size > 0 && !W._tdHeld) turned += Math.abs(d) || 0; };
  try {
    while (!S.dead && !S.result && S.t - t0 < 15) {
      const ps = [...(W.ptrs?.values() || [])];
      if (ps.length === 1 && !S.paused) { const p = ps[0]; tag.style.left = Math.max(120, Math.min(innerWidth - 120, p.x)) + 'px'; tag.style.top = Math.max(150, p.y - 70) + 'px'; tag.classList.add('on'); }
      else tag.classList.remove('on');
      if (turned > .15 && !W.ptrs.size) { ok = true; break; }
      await S.tw.wait(.05);
    }
  } finally {
    W.onRotate = prev; line.remove(); tag.remove(); if (S.tutEls?.[0] === line) { S.tutEls = null; S._tutEnd = S.t; }
  }
  if (ok) { const T = G.save.tut || (G.save.tut = {}); T.ftap = 1; G.persist?.(); G.audio.sfx('special'); }
  return ok;
}
// 1판 (user: "하나 찾으니까 종료된다 … 몇 개 눈에 보이는 거 좀 더 찾게"): beside the friend in the toy box, three things lying in
// plain sight around 토순이's room — on top of things, toward you, one per piece of furniture — so the moves get some use first
export const FIRST_FINDS = ['star', 'gift', 'teddy'];
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
  K('히히, 들켰다! …아, 숨다가 떨어뜨린 게 있어.', 'Hehe, you found me! …Oh, I dropped some things while hiding.'),
  K('별이랑 선물이랑 곰인형! 같이 찾아 줘!', 'A star, a gift and a teddy bear! Help me find them!'),
];
export async function firstFindsTalk(S) {
  const fr = () => S.targets.find(t => t.friend);
  while (!S.dead && !S.result && !fr()?.found) await S.tw.wait(.3);
  if (S.dead || S.result || S.targets.every(t => t.found)) return;
  for (let i = 0; i < 30 && (S.talking || S.cine || S.G.world.flying) && !S.dead; i++) await S.tw.wait(.2);
  const who = S.friend?.root ? S.friend : null; if (!who || S.dead || S.result) return;
  S.say(who, FIRST_SAY[0], 2400); await S.tw.wait(2.6);
  if (!S.dead && !S.result) S.say(who, FIRST_SAY[1], 2600);
}

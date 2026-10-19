// 타이머 털기 (내 집 지키기·털기 메타, 10/19 — user: "클래시옵클랜처럼 숨기고 공격하는걸… 딱 아 이거구나 싶게",
// "타이머 모드로해야겠구나"). Someone else's room plays against its owner's count: 너굴이's clock, unchanged (a find in a
// combo gives seconds back, a wrong tap takes 2), and no tap limit on top. The clock running out is not a loss — you keep
// what you found. Each find flies into the loot bag at the top and pays at once; the room's 보물 (what's behind its lock,
// else what's inside a drawer) pays more. At the end three stars stamp in, Clash-style: ★ half · ★ the 보물 · ★ everything.
// Not in testing my own room (selfTest) or an art preview. Diagnosis: https://claude.ai/artifact/GP26M9AFDHdPV7GvCFFBcn
import { h, ICON } from './ui.js';
import { ITEMS } from './gfx/items.js';
import { retrieve, canGrab } from './raid.js';
import { lensClear } from './lens.js';

// what a raid pays (a room raided before pays a third). A full clear of 5 things is about what the old win paid (40+15n+…).
export const RAID = { find: 15, treasure: 40, star: 15, back: 20 };
const OFF = (() => { try { return new URLSearchParams(location.search).get('raid') === '0'; } catch { return false; } })();   // ?raid=0: the old visit (no clock, all or nothing) to compare
export const isRaid = S => !OFF && !!(S.custom && !S.custom.selfTest && !S.preview);
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
const ownerOf = S => S.custom.nick || S.custom.ownerName || '주인';
const val = (S, v) => Math.max(1, Math.round(v * S.raidRun.rate));

// after buildHud: the 보물, the loot bag, the clock in the top bar
export function raidSetup(S) {
  if (!isRaid(S)) return;
  const G = S.G, key = S.custom.practice ? S.custom.id : S.custom.owner;
  const repeat = !!G.save.visits?.[key]?.ok;
  S.raidRun = { bag: 0, shown: 0, rate: repeat ? 1 / 3 : 1, repeat };
  // the 보물: never one of my own things; behind the room's lock first, then inside a drawer or a lid, else one by the room's seed
  const mine = new Set(S.custom.stolen || []), pool = S.targets.filter(t => !mine.has(t.type)), cand = pool.length ? pool : S.targets;
  const locked = t => t.spot?.part && S.plan.locks.some(l => l.part === t.spot.part);
  const tre = cand.find(locked) || cand.find(t => t.spot?.part) || cand[(S.spec.seed || 0) % cand.length];
  if (tre) { tre.treasure = true; tre.slot?.classList.add('treasure'); tre.slot?.append(h('div', { class: 'tretag' }, '보물')); }
  S.lootPill = G.ui.pill('coin', '0', 'loot');
  S.inv.prepend(S.lootPill);
  S.tlEl.textContent = `털기 · 0/${S.targets.length}`;
  S.tnum.textContent = String(Math.ceil(S.spec.time));
  S.tbarI.style.width = '100%';
}
export const raidGoal = S => `${ga(ownerOf(S))} ${Math.ceil(S.spec.time)} 셀 동안 털어라!`;
// just before play: the owner starts counting (the bubble over their head is the clock, as with 너굴이)
export function raidStart(S) {
  if (!S.raidRun) return;
  S.timerOn = true;
  if (S.custom.brag) setTimeout(() => !S.dead && !S.result && S.say(S.friend, S.custom.brag, 1800), 300);
}

// a find: into the bag (it pays now), the number rolls up when it lands
export function raidFind(S, it, s) {
  const G = S.G, R = S.raidRun;
  const v = val(S, it.treasure ? RAID.treasure : RAID.find);
  R.bag += v;
  S.tlEl.textContent = `털기 · ${S.found}/${S.targets.length}`;
  if (it.treasure) { G.ui.floatText(s.x, s.y - 92, '보물 털었다!', 'gold big'); G.world.fx.ring(s.x, s.y, { r: 130, color: '#ffb300', width: 10 }); G.hitstop?.(.08); }
  else if (S.custom.stolen?.includes(it.type)) G.ui.floatText(s.x, s.y - 92, '내 거 찾았다!', 'gold');
  const pill = S.lootPill;
  G.ui.flyImg(it.thumb || G.thumbs['item_' + it.type], s.x, s.y, pill, { size: 56, dur: 560 }).then(() => {
    if (S.dead) return;
    const from = R.shown; R.shown += v;
    pill.classList.remove('pop'); void pill.offsetWidth; pill.classList.add('pop');
    G.ui.floatText(pill.getBoundingClientRect().right + 6, pill.getBoundingClientRect().top + 6, `+${v}`, 'gold');
    G.ui.countUp(pill.querySelector('.v'), from, R.shown, 380, n => { if (n % 5 === 0) G.audio.sfx('coin', 0); });
  });
}

// the end — everything found ('all'), the count ran out ('time') or you stopped ('stop'): what you found is yours
export async function raidSettle(S, why) {
  const G = S.G, W = G.world, R = S.raidRun;
  if (S.result || S.dead) return;
  S.clearTapTimers();
  S.result = 'clear'; S.running = false; S.tEnd = S.t;
  if (G.ui.panelOpen) G.ui.closePanel(true);
  S.paused = false;
  const n = S.targets.length, found = S.targets.filter(t => t.found), all = found.length === n, tre = S.targets.find(t => t.treasure);
  const stars = [found.length * 2 >= n, !!tre?.found, all], starN = stars.filter(Boolean).length;
  S.stars = starN;
  // the moment: the bag is full, or the owner finished counting
  const f = S.friend;
  if (all) { W.fx.confetti(90); G.audio.sfx('win'); S.setMong('happy', 'hop'); }
  else {
    G.audio.sfx('lose');
    f.pose = 'idle'; f.setFace?.('wow'); f.faceTo?.(0, 0); f.bump?.(.4);
    S.say(f, why === 'time' ? '다 셌다! 거기까지~' : '어? 벌써 가?', 1500);
    S.setMong('happy', 'hop');
  }
  G.ui.banner(all ? '몽땅 털었다!' : why === 'time' ? '시간 끝!' : '그만 털기!', all ? (tre ? '보물까지 싹!' : '하나도 안 남겼어!') : `${found.length}개 털었어 · 찾은 만큼 내 거!`, 1100);
  await S.tw.wait(1.3);
  if (S.dead) return;
  // coins: the bag (paid per find) + the stars, sent as they are
  const starCoins = val(S, RAID.star) * starN;
  const res = G.onVisitResult(S.custom, all, found.length, n, R.bag + starCoins, true);
  // my things come back only if found; one thing pocketed from what was found
  const back = retrieve(G, S.custom, found.map(t => t.type));
  let got = null;
  if (found.some(t => !back.includes(t.type)) && canGrab(G, S.custom)) got = await S.pickLoot(back, found);
  if (S.dead) return;
  const lensLine = all && G.econ ? lensClear(S) : null;
  // the panel: three stamps, the loot tally, a total that rolls up
  const starEls = [0, 1, 2].map(() => h('div', { class: 'st', html: ICON.star }));
  const line = (k, sub, v) => h('div', { class: 'lrow' }, h('span', { class: 'k' }, k, sub ? h('small', {}, sub) : ''), h('b', {}, `+${v}`));
  const rows = [line('찾은 물건', `${found.length}/${n}` + (tre?.found ? ' · 보물 포함' : ''), R.bag)];
  if (starN) rows.push(line('별', '★'.repeat(starN), starCoins));
  if (back.length) rows.push(line('되찾은 내 물건', `${back.length}개`, back.length * RAID.back));
  if (got && !got.isNew) rows.push(line('슬쩍 (이미 있음)', ITEMS[got.item]?.name || '', got.coins));
  const total = R.bag + starCoins + back.length * RAID.back + (got?.coins || 0);
  const cv = h('span', {}, '0');
  const left = S.custom.stolen?.filter(t => !back.includes(t)) || [];
  const p = G.ui.panel({
    title: all ? '몽땅 털었다!' : '털기 끝!', color: all ? 'green' : 'orange', cls: 'raidend',
    body: [h('div', { class: 'stars' }, ...starEls),
      h('div', { class: 'starwhy' }, ...['★ 절반', '★ 보물', '★ 전부'].map((t, i) => h('span', { class: stars[i] ? 'on' : '' }, t))),
      h('div', { class: 'loottab' }, ...rows),
      h('div', { class: 'reward', html: ICON.coin }, cv),
      ...(R.repeat ? [h('div', { class: 'txt' }, '전에 몽땅 턴 집이라 ⅓만 나와요')] : []),
      ...(lensLine ? [h('div', { class: 'txt lensline' }, lensLine)] : []),
      ...(back.length ? [h('div', { class: 'memento mine' }, h('div', {}, h('b', {}, `내 물건 ${back.length}개 되찾았다!`), h('div', { class: 'icons' }, ...back.slice(0, 12).map(t => h('img', { src: G.thumbs['item_' + t] })))))] : []),
      ...(left.length ? [h('div', { class: 'txt' }, `아직 ${ga(ownerOf(S))} 내 물건 ${left.length}개를 갖고 있어. 다시 털러 오자!`)] : []),
      ...(got ? [h('div', { class: 'memento' }, h('img', { src: G.thumbs['item_' + got.item] }), h('div', {}, h('b', {}, '슬쩍 챙김!'), h('div', {}, got.isNew ? `${ITEMS[got.item]?.name || ''} · 내 수집품에 추가! 내 집에 숨길 수 있어` : `${ITEMS[got.item]?.name || ''} · 이미 있어서 코인 +${got.coins}`)))] : []),
      ...(got && S.custom.resident ? [h('div', { class: 'txt' }, `${ga(S.custom.nick)} 눈치챘을지도… 복수하러 올 수 있어! 내 집 물건을 더 꼭꼭 숨겨 둬`)] : [])],
    buttons: [G.ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') }),
      S.nextBtn = G.ui.btn('다른 집', { color: 'green', icon: 'play', cls: 'big', onClick: () => G.go('visit') })],
  });
  for (let i = 0; i < 3; i++) {
    await S.tw.wait(.34); if (S.dead) return;
    if (stars[i]) { starEls[i].classList.add('on', 'stamp'); G.audio.sfx('star', i); }
  }
  await S.tw.wait(.15); if (S.dead) return;
  G.ui.countUp(cv, 0, total, 800, v => { if (v % 10 === 0) G.audio.sfx('coin', 0); });
  return { res, p };
}
